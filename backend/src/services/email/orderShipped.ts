import { Resend } from 'resend';
import { createBaseEmailTemplate } from './baseTemplate';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface OrderShippedData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  trackingNumber: string;
  carrierName: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: string;
}

export async function sendOrderShippedEmail(data: OrderShippedData): Promise<void> {
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping order shipped email');
    return;
  }

  try {
    const trackingLink = data.trackingUrl || `https://www.google.com/search?q=${data.trackingNumber}+tracking`;

    const content = `
      <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
        Great news, <strong>${data.customerName}</strong>! Your package is on the way!
      </p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #888;">Order Number</p>
        <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 700; color: #E53E3E;">#ZY-${data.orderNumber}</p>
      </div>

      <div style="background-color: #F0FFF4; border: 2px solid #48BB78; border-radius: 6px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #2D3748; font-weight: 600;">Tracking Information</p>
        <p style="margin: 0 0 5px 0; font-size: 14px; color: #555;"><strong>Carrier:</strong> ${data.carrierName}</p>
        <p style="margin: 0; font-size: 14px; color: #555;"><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
      </div>

      ${data.estimatedDeliveryDate ? `
        <div style="background-color: #FFF5F5; border-left: 4px solid #E53E3E; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #555;">
            <strong>Estimated Delivery:</strong> ${data.estimatedDeliveryDate}
          </p>
        </div>
      ` : ''}

      <div style="margin: 30px 0;">
        <h3 style="font-size: 18px; font-weight: 600; color: #1A1A1A; margin-bottom: 20px;">Order Status</h3>
        <div style="display: flex; align-items: center; justify-content: space-between; margin: 20px 0;">
          <div style="text-align: center; flex: 1;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #48BB78; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">✓</div>
            <p style="margin: 0; font-size: 12px; color: #555; font-weight: 600;">Confirmed</p>
          </div>
          <div style="flex: 1; height: 2px; background-color: #48BB78; margin: 0 10px;"></div>
          <div style="text-align: center; flex: 1;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #48BB78; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">✓</div>
            <p style="margin: 0; font-size: 12px; color: #555; font-weight: 600;">Processing</p>
          </div>
          <div style="flex: 1; height: 2px; background-color: #48BB78; margin: 0 10px;"></div>
          <div style="text-align: center; flex: 1;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #E53E3E; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">🚚</div>
            <p style="margin: 0; font-size: 12px; color: #E53E3E; font-weight: 600;">Shipped</p>
          </div>
          <div style="flex: 1; height: 2px; background-color: #E5E5E5; margin: 0 10px;"></div>
          <div style="text-align: center; flex: 1;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #E5E5E5; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: #999;">✓</div>
            <p style="margin: 0; font-size: 12px; color: #999;">Delivered</p>
          </div>
        </div>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${trackingLink}" class="button">
          Track Your Package
        </a>
      </div>

      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; font-size: 16px; color: #1A1A1A;">What if my package doesn't arrive?</h4>
        <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.6;">
          If your package doesn't arrive by the estimated delivery date, please wait 2 additional business days. 
          If it still hasn't arrived, <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com'}/support" style="color: #E53E3E; text-decoration: none;">contact our support team</a> and we'll help you track it down.
        </p>
      </div>
    `;

    const html = createBaseEmailTemplate({
      subject: `🚚 Your order has shipped! #ZY-${data.orderNumber}`,
      preheader: `Your order #ZY-${data.orderNumber} is on the way! Track it now: ${data.trackingNumber}`,
      heading: '🚚 Your Order Has Shipped!',
      content
    });

    await resend.emails.send({
      from: 'ZyloShipping <orders@zyloshipping.com>',
      to: data.customerEmail,
      subject: `🚚 Your order has shipped! #ZY-${data.orderNumber}`,
      html
    });

    console.log(`[Email] Order shipped email sent for #ZY-${data.orderNumber}`);
  } catch (error) {
    console.error(`[Email] Failed to send order shipped email for #ZY-${data.orderNumber}:`, error);
  }
}
