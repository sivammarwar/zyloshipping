import { Resend } from 'resend';
import { createBaseEmailTemplate } from './baseTemplate';
import { prisma } from '../../db/prisma';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendRefundApprovedEmail(orderId: string, scheduledDate: Date): Promise<void> {
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping refund approved email');
    return;
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const formattedDate = scheduledDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const content = `
      <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
        Hello <strong>${order.user.name || 'Customer'}</strong>, great news! Your refund request has been approved.
      </p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #888;">Order Number</p>
        <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 700; color: #E53E3E;">${order.orderNumber}</p>
      </div>

      <div style="background-color: #EBF8FF; border: 2px solid #4299E1; border-radius: 6px; padding: 25px; margin: 30px 0; text-align: center;">
        <p style="margin: 0 0 10px 0; font-size: 16px; color: #2D3748; font-weight: 600;">Refund Amount</p>
        <p style="margin: 0; font-size: 36px; font-weight: 700; color: #4299E1;">
          ₹${order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div style="background-color: #F0FFF4; border-left: 4px solid #48BB78; padding: 20px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; font-size: 16px; color: #1A1A1A;">✓ Refund Approved</h4>
        <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.6;">
          Your refund has been automatically approved by our system. The amount will be processed and refunded to your original payment method.
        </p>
      </div>

      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h4 style="margin: 0 0 15px 0; font-size: 16px; color: #1A1A1A;">Processing Timeline</h4>
        <table style="width: 100%; font-size: 14px; color: #555;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;"><strong>Scheduled Processing:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;"><strong>Working Days:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">2 business days</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Bank Credit Time:</strong></td>
            <td style="padding: 8px 0; text-align: right;">5-7 business days after processing</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #FFFAF0; border-left: 4px solid #ED8936; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.6;">
          <strong>Note:</strong> Your refund will be automatically processed on <strong>${formattedDate}</strong>. 
          You'll receive another email once the refund has been initiated with your payment provider.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com'}/orders/${orderId}" class="button">
          View Order Details
        </a>
      </div>

      <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
        Thank you for your patience. We're committed to making this right.
      </p>
    `;

    const html = createBaseEmailTemplate({
      subject: `✓ Refund Approved - ₹${order.totalAmount.toLocaleString('en-IN')} ${order.orderNumber}`,
      preheader: `Your refund of ₹${order.totalAmount.toLocaleString('en-IN')} has been approved and will be processed on ${formattedDate}.`,
      heading: '✓ Refund Approved',
      content,
    });

    await resend.emails.send({
      from: 'ZyloShipping <orders@zyloshipping.com>',
      to: order.user.email,
      subject: `✓ Refund Approved - ₹${order.totalAmount.toLocaleString('en-IN')} ${order.orderNumber}`,
      html,
    });

    console.log(`[Email] Refund approved email sent for ${order.orderNumber}`);
  } catch (error) {
    console.error(`[Email] Failed to send refund approved email:`, error);
  }
}
