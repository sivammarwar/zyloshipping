import { Resend } from 'resend';
import { createBaseEmailTemplate } from './baseTemplate';
import { prisma } from '../../db/prisma';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendRefundUnderReviewEmail(orderId: string): Promise<void> {
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping refund under review email');
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
        Hello <strong>${order.user.name || 'Customer'}</strong>, we've received your refund request for order ${order.orderNumber}.
      </p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #888;">Order Number</p>
        <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 700; color: #E53E3E;">${order.orderNumber}</p>
      </div>

      <div style="background-color: #FFFAF0; border: 2px solid #ED8936; border-radius: 6px; padding: 25px; margin: 30px 0; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 10px;">⏳</div>
        <h4 style="margin: 0 0 10px 0; font-size: 18px; color: #C05621; font-weight: 600;">Under Review</h4>
        <p style="margin: 0; font-size: 14px; color: #555;">
          Our team is reviewing your refund request
        </p>
      </div>

      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h4 style="margin: 0 0 15px 0; font-size: 16px; color: #1A1A1A;">What Happens Next?</h4>
        <table style="width: 100%; font-size: 14px; color: #555;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; vertical-align: top;">
              <strong>1. Review</strong>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
              Our team will carefully review your request and order details
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; vertical-align: top;">
              <strong>2. Decision</strong>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
              You'll receive an email with our decision within 24 hours
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; vertical-align: top;">
              <strong>3. Processing</strong>
            </td>
            <td style="padding: 12px 0;">
              If approved, your refund will be processed within 2 working days
            </td>
          </tr>
        </table>
      </div>

      <div style="background-color: #EBF8FF; border-left: 4px solid #4299E1; padding: 20px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; font-size: 16px; color: #1A1A1A;">Why Manual Review?</h4>
        <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.6;">
          Your refund request requires manual review due to one of the following reasons:
        </p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px; color: #555; line-height: 1.8;">
          <li>High-value order (requires additional verification)</li>
          <li>Order delivered more than 14 days ago</li>
          <li>Additional information needed to process your request</li>
        </ul>
      </div>

      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; font-size: 16px; color: #1A1A1A;">Need to Add More Information?</h4>
        <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.6;">
          If you have additional details, photos, or documentation that would help us process your request faster, 
          please reply to this email or contact our support team.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com'}/support" class="button">
          Contact Support
        </a>
      </div>

      <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
        We appreciate your patience and will get back to you as soon as possible.
      </p>
    `;

    const html = createBaseEmailTemplate({
      subject: `⏳ Refund Under Review - ${order.orderNumber}`,
      preheader: `Your refund request for order ${order.orderNumber} is being reviewed by our team.`,
      heading: '⏳ Refund Under Review',
      content,
    });

    await resend.emails.send({
      from: 'ZyloShipping <orders@zyloshipping.com>',
      to: order.user.email,
      subject: `⏳ Refund Under Review - ${order.orderNumber}`,
      html,
    });

    console.log(`[Email] Refund under review email sent for ${order.orderNumber}`);
  } catch (error) {
    console.error(`[Email] Failed to send refund under review email:`, error);
  }
}
