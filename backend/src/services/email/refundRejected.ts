import { Resend } from 'resend';
import { createBaseEmailTemplate } from './baseTemplate';
import { prisma } from '../../db/prisma';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendRefundRejectedEmail(orderId: string, reason: string): Promise<void> {
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping refund rejected email');
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

    const content = `
      <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
        Hello <strong>${order.user.name || 'Customer'}</strong>, we've reviewed your refund request for order ${order.orderNumber}.
      </p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #888;">Order Number</p>
        <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 700; color: #E53E3E;">${order.orderNumber}</p>
      </div>

      <div style="background-color: #FFF5F5; border: 2px solid #FC8181; border-radius: 6px; padding: 25px; margin: 30px 0;">
        <h4 style="margin: 0 0 15px 0; font-size: 18px; color: #C53030; font-weight: 600;">Refund Request Not Approved</h4>
        <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.6;">
          Unfortunately, we're unable to approve your refund request at this time.
        </p>
      </div>

      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; font-size: 16px; color: #1A1A1A;">Reason</h4>
        <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.6;">
          ${reason}
        </p>
      </div>

      <div style="background-color: #EBF8FF; border-left: 4px solid #4299E1; padding: 20px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; font-size: 16px; color: #1A1A1A;">Need Help?</h4>
        <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.6;">
          If you believe this decision was made in error or if you have additional information to support your request, 
          please contact our support team. We're here to help resolve any issues.
        </p>
      </div>

      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h4 style="margin: 0 0 15px 0; font-size: 16px; color: #1A1A1A;">Our Refund Policy</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #555; line-height: 1.8;">
          <li>Refunds are available within 30 days of order placement</li>
          <li>Items must be unused and in original condition</li>
          <li>Refunds for damaged items require photo evidence</li>
          <li>Change of mind refunds accepted within 7 days of delivery</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com'}/support" class="button">
          Contact Support
        </a>
      </div>

      <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
        We value your business and want to ensure you're satisfied with your experience.
      </p>
    `;

    const html = createBaseEmailTemplate({
      subject: `Refund Request Update - ${order.orderNumber}`,
      preheader: `Your refund request for order ${order.orderNumber} has been reviewed.`,
      heading: 'Refund Request Update',
      content,
    });

    await resend.emails.send({
      from: 'ZyloShipping <orders@zyloshipping.com>',
      to: order.user.email,
      subject: `Refund Request Update - ${order.orderNumber}`,
      html,
    });

    console.log(`[Email] Refund rejected email sent for ${order.orderNumber}`);
  } catch (error) {
    console.error(`[Email] Failed to send refund rejected email:`, error);
  }
}
