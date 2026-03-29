import { Request, Response } from 'express';
import crypto from 'crypto';
import { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { transitionOrder } from '../order/stateMachine';
import { notifyOutForDelivery } from '../order/orderAutomation.service';
import { sendAlertEmail } from '../email.service';

function verifyAftership(body: string, signature: string | undefined, secret: string) {
  if (!signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function appendItemEvent(itemId: string, event: Record<string, unknown>) {
  return prisma.$transaction(async tx => {
    const row = await tx.orderItem.findUnique({ where: { id: itemId } });
    if (!row) return;
    const raw = row.trackingEventsJson;
    const prev = Array.isArray(raw) ? raw : [];
    await tx.orderItem.update({
      where: { id: itemId },
      data: {
        trackingEventsJson: [...prev, event] as Prisma.InputJsonValue,
      },
    });
  });
}

export async function handleAftershipWebhook(req: Request, res: Response) {
  const secret = process.env.AFTERSHIP_WEBHOOK_SECRET;
  const raw = req.body instanceof Buffer ? req.body.toString('utf8') : JSON.stringify(req.body);
  const sig = req.headers['aftership-hmac-sha256'] as string | undefined;

  if (secret && !verifyAftership(raw, sig, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let data: {
    msg?: {
      tracking_number?: string;
      tag?: string;
      checkpoints?: { checkpoint_time?: string; city?: string; message?: string }[];
    };
  };
  try {
    data = JSON.parse(raw);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const tracking = data.msg?.tracking_number;
  const tag = data.msg?.tag;

  if (!tracking) {
    return res.json({ ok: true, ignored: true });
  }

  const items = await prisma.orderItem.findMany({
    where: { trackingNumber: tracking },
    include: { order: true },
  });

  const checkpoint = data.msg?.checkpoints?.[0];

  for (const item of items) {
    await appendItemEvent(item.id, {
      tag: tag ?? 'update',
      at: new Date().toISOString(),
      city: checkpoint?.city,
      message: checkpoint?.message,
    });

    const orderId = item.orderId;
    const order = item.order;

    await prisma.orderTracking.create({
      data: {
        orderId,
        status: tag || 'update',
        location: checkpoint?.city ?? null,
        description: checkpoint?.message ?? null,
        timestamp: checkpoint?.checkpoint_time
          ? new Date(checkpoint.checkpoint_time)
          : new Date(),
        source: 'aftership',
      },
    });

    try {
      switch (tag) {
        case 'InfoReceived':
          console.log('[aftership] InfoReceived', tracking);
          break;
        case 'InTransit':
          if (order.status === OrderStatus.SHIPPED) {
            await transitionOrder(orderId, OrderStatus.IN_TRANSIT, 'aftership_in_transit');
          }
          break;
        case 'OutForDelivery':
          await notifyOutForDelivery(orderId);
          break;
        case 'Delivered':
          if (
            order.status === OrderStatus.IN_TRANSIT ||
            order.status === OrderStatus.SHIPPED
          ) {
            if (order.status === OrderStatus.SHIPPED) {
              await transitionOrder(orderId, OrderStatus.IN_TRANSIT, 'aftership_pre_delivered');
            }
            await transitionOrder(orderId, OrderStatus.DELIVERED, 'aftership_delivered');
          }
          break;
        case 'Exception':
          await sendAlertEmail(
            `AfterShip exception: ${order.orderNumber}`,
            JSON.stringify(data.msg, null, 2)
          ).catch(() => {});
          break;
        default:
          break;
      }
    } catch (e) {
      console.error('[aftership] transition error', orderId, e);
    }
  }

  res.json({ ok: true });
}
