import { Resend } from 'resend';
import { createBaseEmailTemplate } from './baseTemplate';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface OrderItem {
  productTitle: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationData): Promise<void> {
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping order confirmation email');
    return;
  }

  try {
    const itemsTable = `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="border-bottom: 2px solid #e5e5e5;">
            <th style="text-align: left; padding: 12px; font-weight: 600; color: #333;">Product</th>
            <th style="text-align: center; padding: 12px; font-weight: 600; color: #333;">Qty</th>
            <th style="text-align: right; padding: 12px; font-weight: 600; color: #333;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr style="border-bottom: 1px solid #f0f0f0;">
              <td style="padding: 12px; color: #555;">${item.productTitle}</td>
              <td style="text-align: center; padding: 12px; color: #555;">${item.quantity}</td>
              <td style="text-align: right; padding: 12px; color: #555;">₹${item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 12px; text-align: right; font-weight: 600; color: #333;">Subtotal:</td>
            <td style="text-align: right; padding: 12px; font-weight: 600; color: #333;">₹${data.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 12px; text-align: right; font-weight: 600; color: #333;">Shipping:</td>
            <td style="text-align: right; padding: 12px; font-weight: 600; color: #333;">₹${data.shipping.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr style="border-top: 2px solid #e5e5e5;">
            <td colspan="2" style="padding: 12px; text-align: right; font-weight: 700; color: #1A1A1A; font-size: 18px;">Total:</td>
            <td style="text-align: right; padding: 12px; font-weight: 700; color: #E53E3E; font-size: 18px;">₹${data.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
        </tfoot>
      </table>
    `;

    const content = `
      <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
        Thank you <strong>${data.customerName}</strong>! Your order has been confirmed and is being processed.
      </p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #888;">Order Number</p>
        <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 700; color: #E53E3E;">#ZY-${data.orderNumber}</p>
      </div>

      ${itemsTable}

      <div style="margin: 30px 0;">
        <h3 style="font-size: 18px; font-weight: 600; color: #1A1A1A; margin-bottom: 15px;">Shipping Address</h3>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px;">
          <p style="margin: 0 0 5px 0; font-weight: 600; color: #333;">${data.shippingAddress.name}</p>
          <p style="margin: 0 0 5px 0; color: #555;">${data.shippingAddress.address}</p>
          <p style="margin: 0 0 5px 0; color: #555;">${data.shippingAddress.city}, ${data.shippingAddress.state} - ${data.shippingAddress.pincode}</p>
          <p style="margin: 0; color: #555;">Phone: ${data.shippingAddress.phone}</p>
        </div>
      </div>

      <div style="background-color: #FFF5F5; border-left: 4px solid #E53E3E; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #555;">
          <strong>Estimated Delivery:</strong> 7-14 business days
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com'}/orders/${data.orderId}" class="button">
          Track Your Order
        </a>
      </div>

      <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
        Need help? <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com'}/support" style="color: #E53E3E; text-decoration: none;">Contact Support</a>
      </p>
    `;

    const html = createBaseEmailTemplate({
      subject: `✅ Order Confirmed! #ZY-${data.orderNumber}`,
      preheader: `Your order #ZY-${data.orderNumber} has been confirmed. Estimated delivery: 7-14 business days.`,
      heading: '✅ Order Confirmed!',
      content
    });

    await resend.emails.send({
      from: 'ZyloShipping <orders@zyloshipping.com>',
      to: data.customerEmail,
      subject: `✅ Order Confirmed! #ZY-${data.orderNumber}`,
      html
    });

    console.log(`[Email] Order confirmation sent for #ZY-${data.orderNumber}`);
  } catch (error) {
    console.error(`[Email] Failed to send order confirmation for #ZY-${data.orderNumber}:`, error);
  }
}
