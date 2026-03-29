import { Resend } from 'resend';
import { createBaseEmailTemplate } from './baseTemplate';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface OrderDeliveredData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  productSlug?: string;
}

export async function sendOrderDeliveredEmail(data: OrderDeliveredData): Promise<void> {
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping order delivered email');
    return;
  }

  try {
    const reviewUrl = data.productSlug 
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com'}/products/${data.productSlug}#review`
      : `${process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com'}/orders/${data.orderId}`;

    const content = `
      <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
        Great news, <strong>${data.customerName}</strong>! Your order has been delivered successfully!
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
          <div style="flex: 1; height: 2px; background-color: #48BB78; margin: 0 10px;"></div>
          <div style="text-align: center; flex: 1;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #48BB78; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">✓</div>
            <p style="margin: 0; font-size: 12px; color: #48BB78; font-weight: 600;">Delivered</p>
          </div>
        </div>
      </div>

      <div style="background-color: #F0FFF4; border: 2px solid #48BB78; border-radius: 6px; padding: 25px; margin: 30px 0; text-align: center;">
        <h3 style="margin: 0 0 15px 0; font-size: 20px; color: #1A1A1A;">How was your experience?</h3>
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #555;">
          We'd love to hear your feedback! Your review helps other customers make informed decisions.
        </p>
        <div style="margin: 20px 0;">
          <span style="font-size: 32px; color: #FDB022; margin: 0 3px;">⭐</span>
          <span style="font-size: 32px; color: #FDB022; margin: 0 3px;">⭐</span>
          <span style="font-size: 32px; color: #FDB022; margin: 0 3px;">⭐</span>
          <span style="font-size: 32px; color: #FDB022; margin: 0 3px;">⭐</span>
          <span style="font-size: 32px; color: #FDB022; margin: 0 3px;">⭐</span>
        </div>
        <a href="${reviewUrl}" class="button" style="margin-top: 10px;">
          Write a Review
        </a>
      </div>

      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; font-size: 16px; color: #1A1A1A;">Not satisfied with your order?</h4>
        <p style="margin: 0 0 15px 0; font-size: 14px; color: #555; line-height: 1.6;">
          We offer a <strong>7-day return policy</strong> for most items. If you're not completely satisfied, 
          you can request a return within 7 days of delivery.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com'}/orders/${data.orderId}/return" 
           style="color: #E53E3E; text-decoration: none; font-weight: 600; font-size: 14px;">
          Request a Return →
        </a>
      </div>

      <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
        Thank you for shopping with ZyloShipping! We hope to see you again soon.
      </p>
    `;

    const html = createBaseEmailTemplate({
      subject: `📬 Order Delivered! How was it? #ZY-${data.orderNumber}`,
      preheader: `Your order #ZY-${data.orderNumber} has been delivered. Share your experience!`,
      heading: '📬 Order Delivered!',
      content
    });

    await resend.emails.send({
      from: 'ZyloShipping <orders@zyloshipping.com>',
      to: data.customerEmail,
      subject: `📬 Order Delivered! How was it? #ZY-${data.orderNumber}`,
      html
    });

    console.log(`[Email] Order delivered email sent for #ZY-${data.orderNumber}`);
  } catch (error) {
    console.error(`[Email] Failed to send order delivered email for #ZY-${data.orderNumber}:`, error);
  }
}
