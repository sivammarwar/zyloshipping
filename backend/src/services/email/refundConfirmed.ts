import { Resend } from 'resend';
import { createBaseEmailTemplate } from './baseTemplate';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface RefundConfirmedData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  gateway: string;
}

export async function sendRefundConfirmedEmail(data: RefundConfirmedData): Promise<void> {
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping refund confirmed email');
    return;
  }

  try {
    const gatewayName = data.gateway === 'RAZORPAY' ? 'Razorpay' : 
                        data.gateway === 'STRIPE' ? 'Stripe' : 
                        data.gateway;

    const content = `
      <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
        Hello <strong>${data.customerName}</strong>, your refund has been processed successfully.
      </p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #888;">Order Number</p>
        <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 700; color: #E53E3E;">#ZY-${data.orderNumber}</p>
      </div>

      <div style="background-color: #F0FFF4; border: 2px solid #48BB78; border-radius: 6px; padding: 25px; margin: 30px 0; text-align: center;">
        <p style="margin: 0 0 10px 0; font-size: 16px; color: #2D3748; font-weight: 600;">Refund Amount</p>
        <p style="margin: 0; font-size: 36px; font-weight: 700; color: #48BB78;">
          ₹${data.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h4 style="margin: 0 0 15px 0; font-size: 16px; color: #1A1A1A;">Refund Details</h4>
        <table style="width: 100%; font-size: 14px; color: #555;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;"><strong>Payment Method:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">${gatewayName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;"><strong>Processing Time:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">5-7 business days</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Refund Status:</strong></td>
            <td style="padding: 8px 0; text-align: right; color: #48BB78; font-weight: 600;">Processed</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #FFF5F5; border-left: 4px solid #E53E3E; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.6;">
          <strong>Important:</strong> The refund will be credited to your original payment method within 5-7 business days. 
          The exact timing depends on your bank or card issuer.
        </p>
      </div>

      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; font-size: 16px; color: #1A1A1A;">Haven't received your refund?</h4>
        <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.6;">
          If you don't see the refund in your account after 7 business days, please check with your bank first. 
          If the issue persists, <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com'}/support" style="color: #E53E3E; text-decoration: none;">contact our support team</a> 
          with your order number and we'll investigate immediately.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com'}/orders/${data.orderId}" class="button">
          View Order Details
        </a>
      </div>

      <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
        We're sorry this order didn't work out. We hope to serve you better next time!
      </p>
    `;

    const html = createBaseEmailTemplate({
      subject: `💰 Refund Processed - ₹${data.amount.toLocaleString('en-IN')} #ZY-${data.orderNumber}`,
      preheader: `Your refund of ₹${data.amount.toLocaleString('en-IN')} has been processed. It will reflect in 5-7 business days.`,
      heading: '💰 Refund Processed',
      content
    });

    await resend.emails.send({
      from: 'ZyloShipping <orders@zyloshipping.com>',
      to: data.customerEmail,
      subject: `💰 Refund Processed - ₹${data.amount.toLocaleString('en-IN')} #ZY-${data.orderNumber}`,
      html
    });

    console.log(`[Email] Refund confirmed email sent for #ZY-${data.orderNumber}`);
  } catch (error) {
    console.error(`[Email] Failed to send refund confirmed email for #ZY-${data.orderNumber}:`, error);
  }
}
