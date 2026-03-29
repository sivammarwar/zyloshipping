import { Resend } from 'resend';
import { createBaseEmailTemplate } from './baseTemplate';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface OrderProcessingData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
}

export async function sendOrderProcessingEmail(data: OrderProcessingData): Promise<void> {
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping order processing email');
    return;
  }

  try {
    const content = `
      <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
        Great news, <strong>${data.customerName}</strong>! Your order is on its way to being shipped.
      </p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #888;">Order Number</p>
        <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 700; color: #E53E3E;">#ZY-${data.orderNumber}</p>
      </div>

      <div style="margin: 30px 0;">
        <h3 style="font-size: 18px; font-weight: 600; color: #1A1A1A; margin-bottom: 20px;">Order Status</h3>
        <div style="display: flex; align-items: center; justify-content: space-between; margin: 20px 0;">
          <div style="text-align: center; flex: 1;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #48BB78; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">✓</div>
            <p style="margin: 0; font-size: 12px; color: #555; font-weight: 600;">Confirmed</p>
          </div>
          <div style="flex: 1; height: 2px; background-color: #E53E3E; margin: 0 10px;"></div>
          <div style="text-align: center; flex: 1;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #E53E3E; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">🔄</div>
            <p style="margin: 0; font-size: 12px; color: #E53E3E; font-weight: 600;">Processing</p>
          </div>
          <div style="flex: 1; height: 2px; background-color: #E5E5E5; margin: 0 10px;"></div>
          <div style="text-align: center; flex: 1;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #E5E5E5; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: #999;">📦</div>
            <p style="margin: 0; font-size: 12px; color: #999;">Shipped</p>
          </div>
          <div style="flex: 1; height: 2px; background-color: #E5E5E5; margin: 0 10px;"></div>
          <div style="text-align: center; flex: 1;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #E5E5E5; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: #999;">✓</div>
            <p style="margin: 0; font-size: 12px; color: #999;">Delivered</p>
          </div>
        </div>
      </div>

      <div style="background-color: #FFF5F5; border-left: 4px solid #E53E3E; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #555;">
          <strong>Expected Dispatch:</strong> Within 24-48 hours
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com'}/orders/${data.orderId}" class="button">
          View Order Details
        </a>
      </div>

      <p style="font-size: 14px; color: #888; margin-top: 30px;">
        We're working with our suppliers to get your order ready for shipment. You'll receive another email with tracking information once your order ships.
      </p>
    `;

    const html = createBaseEmailTemplate({
      subject: `📦 Your order is being prepared #ZY-${data.orderNumber}`,
      preheader: `Your order #ZY-${data.orderNumber} is being prepared for shipment.`,
      heading: '📦 Order Being Prepared',
      content
    });

    await resend.emails.send({
      from: 'ZyloShipping <orders@zyloshipping.com>',
      to: data.customerEmail,
      subject: `📦 Your order is being prepared #ZY-${data.orderNumber}`,
      html
    });

    console.log(`[Email] Order processing email sent for #ZY-${data.orderNumber}`);
  } catch (error) {
    console.error(`[Email] Failed to send order processing email for #ZY-${data.orderNumber}:`, error);
  }
}
