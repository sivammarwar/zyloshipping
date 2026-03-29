import { Response } from 'express';
import { Prisma, TicketStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth.middleware';
import { parsePagination } from '../../utils/pagination';
import { logAdminAction } from '../../services/admin/adminLog.service';

export async function listTickets(req: AuthRequest, res: Response) {
  try {
    const { page, limit, skip } = parsePagination(req, 20, 100);
    const statusStr = typeof req.query.status === 'string' ? req.query.status : undefined;
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const where: Prisma.SupportTicketWhereInput = {};

    if (statusStr && Object.values(TicketStatus).includes(statusStr as TicketStatus)) {
      where.status = statusStr as TicketStatus;
    }

    if (q.length > 0) {
      const orders = await prisma.order.findMany({
        where: { orderNumber: { contains: q, mode: 'insensitive' } },
        select: { id: true },
        take: 50,
      });
      const oids = orders.map(o => o.id);
      where.OR = [
        { user: { email: { contains: q, mode: 'insensitive' } } },
        ...(oids.length ? [{ orderId: { in: oids } }] : []),
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    res.json({
      tickets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error('[admin.support.list]', e);
    res.status(500).json({ error: 'Failed to list tickets' });
  }
}

export async function getTicket(req: AuthRequest, res: Response) {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    let order = null as Awaited<ReturnType<typeof prisma.order.findUnique>> | null;
    if (ticket.orderId) {
      order = await prisma.order.findUnique({
        where: { id: ticket.orderId },
        include: {
          items: { include: { product: { select: { title: true, sku: true } } } },
          tracking: { take: 10, orderBy: { timestamp: 'desc' } },
          payment: true,
        },
      });
    }

    res.json({ ticket, orderContext: order });
  } catch (e) {
    console.error('[admin.support.get]', e);
    res.status(500).json({ error: 'Failed to load ticket' });
  }
}

export async function respondTicket(req: AuthRequest, res: Response) {
  const schema = z.object({
    message: z.string().min(1).max(8000),
  });

  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        adminResponse: parsed.data.message,
        status: TicketStatus.CLOSED,
        resolvedAt: new Date(),
      },
    });

    await logAdminAction(req, {
      action: 'support.respond',
      resource: 'ticket',
      resourceId: ticket.id,
    });

    res.json({ ticket: updated });
  } catch (e) {
    console.error('[admin.support.respond]', e);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
}

export async function escalateTicket(req: AuthRequest, res: Response) {
  const schema = z.object({
    reason: z.string().min(1).max(4000).optional(),
  });

  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: TicketStatus.ESCALATED,
        escalated: true,
        escalatedReason: parsed.data.reason ?? ticket.escalatedReason ?? 'Escalated by admin',
      },
    });

    await logAdminAction(req, {
      action: 'support.escalate',
      resource: 'ticket',
      resourceId: ticket.id,
    });

    res.json({ ticket: updated });
  } catch (e) {
    console.error('[admin.support.escalate]', e);
    res.status(500).json({ error: 'Failed to escalate ticket' });
  }
}
