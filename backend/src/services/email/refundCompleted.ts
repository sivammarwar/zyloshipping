import { Resend } from 'resend';
import { createBaseEmailTemplate } from './baseTemplate';
import { prisma } from '../../db/prisma';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendRefundCompletedEmail(orderId: string, amount: number): Promise<void> {
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping refund completed email');
    return;
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, payment: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const gatewayName = order.payment?.gateway === 'razorpay' ? 'Razorpay' : 
                        order.payment?.gateway === 'stripe' ? 'Stripe' : 
                        order.payment?.gateway || 'Payment Gateway';

    const content = `
      <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
        Hello <strong>${order.user.name || 'Customer'}</strong>, your refund has been successfully processed!
      </p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #888;">Order Number</p>
        <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 700; color: #E53E3E;">${order.orderNumber}</p>
      </div>

      <div style="background-color: #F0FFF4; border: 2px solid #48BB78; border-radius: 6px; padding: 25px; margin: 30px 0; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 10px;">✓</div>
        <p style="margin: 0 0 10px 0; font-size: 16px; color: #2D3748; font-weight: 600;">Refund Completed</p>
        <p style="margin: 0; font-size: 36px; font-weight: 700; color: #48BB78;">
          ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h4 style="margin: 0 0 15px 0; font-size: 16px; color: #1A1A1A;">Refund Details</h4>
        <table style="width: 100%; font-size: 14px; color: #555;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;"><strong>Amount Refunded:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;"><strong>Payment Method:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">${gatewayName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;"><strong>Processing Date:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">${new Date().toLocaleDateString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Status:</strong></td>
            <td style="padding: 8px 0; text-align: right; color: #48BB78; font-weight: 600;">Completed</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #EBF8FF; border-left: 4px solid #4299E1; padding: 20px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; font-size: 16px; color: #1A1A1A;">When Will I See the Refund?</h4>
        <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.6;">
          The refund has been initiated with ${gatewayName}. It typically takes <strong>5-7 business days</strong> 
          for the amount to reflect in your account, depending on your bank or card issuer.
        </p>
      </div>

      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; font-size: 16px; color: #1A1A1A;">Haven't Received Your Refund?</h4>
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #555; line-height: 1.6;">
          If you don't see the refund in your account after 7 business days:
        </p>
        <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #555; line-height: 1.8;">
          <li>Check with your bank or card issuer first</li>
          <li>Verify the refund is going to the correct payment method</li>
          <li>Contact our support team with your order number</li>
        </ol>
      </div>

      <div style="background-color: #FFFAF0; border-left: 4px solid #ED8936; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.6;">
          <strong>Note:</strong> The refund will appear as a credit from ${gatewayName} or ZyloShipping on your statement.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com'}/orders/${orderId}" class="button">
          View Order Details
        </a>
      </div>

      <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
        We're sorry this order didn't work out. We hope to serve you better next time!
      </p>
    `;

    const html = createBaseEmailTemplate({
      subject: `✓ Refund Completed - ₹${amount.toLocaleString('en-IN')} ${order.orderNumber}`,
      preheader: `Your refund of ₹${amount.toLocaleString('en-IN')} has been processed successfully.`,
      heading: '✓ Refund Completed',
      content,
    });

    await resend.emails.send({
      from: 'ZyloShipping <orders@zyloshipping.com>',
      to: order.user.email,
      subject: `✓ Refund Completed - ₹${amount.toLocaleString('en-IN')} ${order.orderNumber}`,
      html,
    });

    console.log(`[Email] Refund completed email sent for ${order.orderNumber}`);
  } catch (error) {
    console.error(`[Email] Failed to send refund completed email:`, error);
  }
}
