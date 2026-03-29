import { Resend } from 'resend';
import { createBaseEmailTemplate } from './baseTemplate';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface OutForDeliveryData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  trackingNumber?: string;
}

export async function sendOutForDeliveryEmail(data: OutForDeliveryData): Promise<void> {
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping out for delivery email');
    return;
  }

  try {
    const content = `
      <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
        Exciting news, <strong>${data.customerName}</strong>! Your package is out for delivery and will arrive today!
      </p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #888;">Order Number</p>
        <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 700; color: #E53E3E;">#ZY-${data.orderNumber}</p>
      </div>

      <div style="background-color: #FFF5F5; border: 2px solid #E53E3E; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; font-size: 20px; font-weight: 700; color: #E53E3E;">📦 Expected Delivery: TODAY</p>
      </div>

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
            <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #48BB78; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">✓</div>
            <p style="margin: 0; font-size: 12px; color: #555; font-weight: 600;">Shipped</p>
          </div>
          <div style="flex: 1; height: 2px; background-color: #E53E3E; margin: 0 10px;"></div>
          <div style="text-align: center; flex: 1;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #E53E3E; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">🚚</div>
            <p style="margin: 0; font-size: 12px; color: #E53E3E; font-weight: 600;">Out for Delivery</p>
          </div>
        </div>
      </div>

      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h4 style="margin: 0 0 15px 0; font-size: 16px; color: #1A1A1A;">What if I'm not home?</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #555; line-height: 1.8;">
          <li>The delivery partner will attempt to contact you via phone</li>
          <li>If unavailable, they may leave the package in a safe location</li>
          <li>Some carriers require a signature - please be available if possible</li>
          <li>You can contact the carrier directly using your tracking number</li>
        </ul>
      </div>

      ${data.trackingNumber ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com'}/orders/${data.orderId}" class="button">
            Track Your Order
          </a>
        </div>
      ` : ''}

      <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
        Questions? <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com'}/support" style="color: #E53E3E; text-decoration: none;">Contact Support</a>
      </p>
    `;

    const html = createBaseEmailTemplate({
      subject: `🎉 Your order arrives TODAY! #ZY-${data.orderNumber}`,
      preheader: `Your order #ZY-${data.orderNumber} is out for delivery and will arrive today!`,
      heading: '🎉 Out for Delivery!',
      content
    });

    await resend.emails.send({
      from: 'ZyloShipping <orders@zyloshipping.com>',
      to: data.customerEmail,
      subject: `🎉 Your order arrives TODAY! #ZY-${data.orderNumber}`,
      html
    });

    console.log(`[Email] Out for delivery email sent for #ZY-${data.orderNumber}`);
  } catch (error) {
    console.error(`[Email] Failed to send out for delivery email for #ZY-${data.orderNumber}:`, error);
  }
}
