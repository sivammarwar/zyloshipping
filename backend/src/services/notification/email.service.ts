import fs from 'fs';
import path from 'path';
import type { Order, OrderItem, Product, User } from '@prisma/client';

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.RESEND_FROM_EMAIL || 'ZyloShipping <onboarding@resend.dev>';

function templateDir(): string {
  const a = path.join(__dirname, '../../templates/emails');
  if (fs.existsSync(a)) return a;
  return path.join(process.cwd(), 'src/templates/emails');
}

function loadTemplate(name: string): string {
  const file = path.join(templateDir(), name);
  return fs.readFileSync(file, 'utf8');
}

function render(html: string, vars: Record<string, string>): string {
  let out = html;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

export type OrderWithItems = Order & {
  user: User | null;
  items?: (OrderItem & { product: Product })[];
};

async function sendHtml(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn('[notification/email] Resend not configured', subject);
    return;
  }
  await resend.emails.send({ from, to, subject, html });
}

function itemsList(order: OrderWithItems): string {
  return (order.items ?? [])
    .map(i => `<tr><td>${i.product.title}</td><td>${i.quantity}</td><td>${i.unitPrice.toFixed(2)}</td></tr>`)
    .join('');
}

export async function sendOrderConfirmedEmail(order: OrderWithItems) {
  if (!order.user?.email) return;
  const html = render(loadTemplate('order-confirmed.html'), {
    orderNumber: order.orderNumber,
    total: order.totalAmount.toFixed(2),
    itemsRows: itemsList(order),
    eta: '7–21 business days',
  });
  await sendHtml(order.user.email, `Order ${order.orderNumber} confirmed`, html);
}

export async function sendOrderProcessingEmail(order: OrderWithItems) {
  if (!order.user?.email) return;
  const html = render(loadTemplate('order-processing.html'), {
    orderNumber: order.orderNumber,
    itemsRows: itemsList(order),
  });
  await sendHtml(order.user.email, `We're preparing order ${order.orderNumber}`, html);
}

export async function sendOrderShippedEmail(order: OrderWithItems, trackingNumber?: string) {
  if (!order.user?.email) return;
  const html = render(loadTemplate('order-shipped.html'), {
    orderNumber: order.orderNumber,
    trackingNumber: trackingNumber || '—',
    trackingLink: trackingNumber
      ? `${process.env.AFTERSHIP_PUBLIC_TRACKING_BASE || 'https://www.aftership.com'}/track/${encodeURIComponent(trackingNumber)}`
      : '#',
  });
  await sendHtml(order.user.email, `Your order ${order.orderNumber} has shipped`, html);
}

export async function sendOutForDeliveryEmail(order: OrderWithItems) {
  if (!order.user?.email) return;
  const html = render(loadTemplate('out-for-delivery.html'), { orderNumber: order.orderNumber });
  await sendHtml(order.user.email, `Arriving today — ${order.orderNumber}`, html);
}

export async function sendOrderDeliveredEmail(order: OrderWithItems) {
  if (!order.user?.email) return;
  const html = render(loadTemplate('order-delivered.html'), { orderNumber: order.orderNumber });
  await sendHtml(order.user.email, `Delivered: ${order.orderNumber}`, html);
}

export async function sendOrderInTransitEmail(order: OrderWithItems) {
  if (!order.user?.email) return;
  const html = render(loadTemplate('order-in-transit.html'), { orderNumber: order.orderNumber });
  await sendHtml(order.user.email, `Your order ${order.orderNumber} is on the way`, html);
}

export async function sendReviewRequestEmail(order: OrderWithItems) {
  if (!order.user?.email) return;
  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${order.orderNumber}`;
  const html = render(loadTemplate('review-request.html'), {
    orderNumber: order.orderNumber,
    reviewUrl,
  });
  await sendHtml(order.user.email, `How was your order ${order.orderNumber}?`, html);
}

export async function sendRefundConfirmedEmail(
  to: string,
  orderNumber: string,
  amount: string,
  currency: string
) {
  const html = render(loadTemplate('refund-confirmed.html'), {
    orderNumber,
    amount,
    currency,
  });
  await sendHtml(to, `Refund processed — ${orderNumber}`, html);
}
