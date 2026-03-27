import crypto  from 'crypto';
import QRCode  from 'qrcode';
import { Request, Response } from 'express';
import { razorpay } from '../razorpay/razorpay.service';
import { toPaise }  from '@zyloshipping/shared/utils/currency';

// Creates a Razorpay order configured for UPI
// Supports: intent (app), collect (VPA), qr
export async function createUpiOrder(req: Request, res: Response) {
  try {
    const { orderId, amount } = req.body;
    const rzpOrder = await razorpay.orders.create({
      amount:   toPaise(amount),
      currency: 'INR',
      receipt:  orderId,
      payment_capture: true,
      method:   'upi' as any, // hint: prefer UPI in Razorpay hosted flow
    });
    res.json({ razorpayOrderId: rzpOrder.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create UPI order', details: err });
  }
}

// Verifies UPI payment HMAC signature (same as standard Razorpay verify)
export async function verifyUpiPayment(req: Request, res: Response) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expected !== razorpay_signature) {
    return res.status(400).json({ verified: false, error: 'Signature mismatch' });
  }
  res.json({ verified: true });
}

// Polls Razorpay for UPI payment status (used by frontend QR poller)
export async function getUpiPaymentStatus(req: Request, res: Response) {
  try {
    const payment = await razorpay.payments.fetch(req.params.paymentId);
    res.json({ status: payment.status, method: payment.method });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch payment status' });
  }
}

// Generates a UPI QR code PNG (data URL) for scan-and-pay flow
export async function generateUpiQr(req: Request, res: Response) {
  try {
    const { amount, orderId } = req.body;
    // Standard UPI deep link format
    const upiString =
      `upi://pay?pa=${process.env.MERCHANT_UPI_VPA}` +
      `&pn=ZyloShipping` +
      `&am=${amount}` +
      `&cu=INR` +
      `&tn=Order-${orderId}`;
    const qrDataUrl = await QRCode.toDataURL(upiString, { width: 300 });
    res.json({ qrDataUrl, upiString });
  } catch (err) {
    res.status(500).json({ error: 'QR generation failed' });
  }
}
