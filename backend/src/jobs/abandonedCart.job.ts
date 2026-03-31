import { prisma } from '../db/prisma';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.RESEND_FROM_EMAIL || 'ZyloShipping <onboarding@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com';

/**
 * Send abandoned cart email
 * Called 2 hours after cart is created without checkout
 */
export async function runAbandonedCartJob(userId: string, cartId: string): Promise<void> {
  try {
    // Check if cart still exists and has items
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!cart || cart.items.length === 0) {
      console.log(`[abandonedCart] Cart ${cartId} is empty or doesn't exist`);
      return;
    }

    // Check if user has already checked out
    const recentOrder = await prisma.order.findFirst({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 2 * 60 * 60 * 1000), // Last 2 hours
        },
      },
    });

    if (recentOrder) {
      console.log(`[abandonedCart] User ${userId} already checked out`);
      return;
    }

    if (!resend) {
      console.warn(`[abandonedCart] Resend not configured — skipping email to ${cart.user.email}`);
      return;
    }

    const itemRows = cart.items.map(item => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#555;font-size:14px;">${item.product.title}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:center;color:#555;font-size:14px;">x${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right;color:#E53E3E;font-size:14px;font-weight:600;">$${(item.product.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const total = cart.items.reduce((s, i) => s + i.product.price * i.quantity, 0);

    const html = `
      <!DOCTYPE html><html><body style="font-family:sans-serif;background:#f9f9f9;margin:0;padding:0;">
      <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:6px;overflow:hidden;border:1px solid #e5e5e5;">
        <div style="background:#E53E3E;padding:24px 32px;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">You left something behind!</h1>
        </div>
        <div style="padding:32px;">
          <p style="color:#555;font-size:15px;margin-top:0;">Hey ${cart.user.name || 'there'}, your cart is waiting for you.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <thead><tr>
              <th style="text-align:left;font-size:12px;color:#888;padding-bottom:8px;">ITEM</th>
              <th style="text-align:center;font-size:12px;color:#888;padding-bottom:8px;">QTY</th>
              <th style="text-align:right;font-size:12px;color:#888;padding-bottom:8px;">PRICE</th>
            </tr></thead>
            <tbody>${itemRows}</tbody>
            <tfoot><tr>
              <td colspan="2" style="padding-top:12px;font-weight:600;color:#333;">Total</td>
              <td style="padding-top:12px;font-weight:700;color:#E53E3E;text-align:right;">$${total.toFixed(2)}</td>
            </tr></tfoot>
          </table>
          <div style="background:#FFF5F5;border:1px dashed #E53E3E;border-radius:4px;padding:16px;text-align:center;margin:24px 0;">
            <p style="margin:0 0 4px 0;font-size:12px;color:#888;">USE CODE AT CHECKOUT</p>
            <p style="margin:0;font-size:20px;font-weight:700;color:#E53E3E;letter-spacing:2px;">COMEBACK10</p>
            <p style="margin:4px 0 0 0;font-size:12px;color:#888;">10% off your order</p>
          </div>
          <div style="text-align:center;">
            <a href="${APP_URL}/cart" style="display:inline-block;background:#E53E3E;color:#fff;text-decoration:none;padding:14px 32px;border-radius:4px;font-weight:600;font-size:15px;">Complete My Order →</a>
          </div>
          <p style="font-size:12px;color:#aaa;text-align:center;margin-top:24px;">This offer expires in 24 hours.</p>
        </div>
      </div>
      </body></html>
    `;

    await resend.emails.send({
      from,
      to: cart.user.email,
      subject: `⏰ Your cart is about to expire — save 10% with COMEBACK10`,
      html,
    });

    console.log(`[abandonedCart] Recovery email sent to ${cart.user.email} for cart ${cartId}`);
  } catch (error) {
    console.error('[abandonedCart] Error processing abandoned cart:', error);
  }
}
