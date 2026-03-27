import Razorpay  from 'razorpay';
import crypto    from 'crypto';
import { Request, Response } from 'express';
import { toPaise } from '@zyloshipping/shared/utils/currency';

export const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Create a Razorpay Order (called before opening the Razorpay checkout)
export async function createRazorpayOrder(req: Request, res: Response) {
  try {
    const { orderId, amount } = req.body; // amount in INR
    const rzpOrder = await razorpay.orders.create({
      amount:   toPaise(amount),           // convert to paise
      currency: 'INR',
      receipt:  orderId,
      payment_capture: true,
    });
    res.json({ razorpayOrderId: rzpOrder.id, amount: rzpOrder.amount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create Razorpay order', details: err });
  }
}

// Verify Razorpay payment signature (must be called before marking order paid)
export async function verifyRazorpayPayment(req: Request, res: Response) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expected !== razorpay_signature) {
    return res.status(400).json({ error: 'Invalid payment signature' });
  }
  // TODO: update order status to PAYMENT_CONFIRMED in DB
  res.json({ verified: true, paymentId: razorpay_payment_id });
}
