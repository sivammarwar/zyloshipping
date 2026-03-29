import { z } from 'zod';

export const razorpayVerifySchema = z.object({
  razorpay_order_id: z.string().min(1, 'Razorpay order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Razorpay payment ID is required'),
  razorpay_signature: z.string().min(1, 'Razorpay signature is required'),
  orderId: z.string().uuid('Invalid order ID')
});

export const stripeIntentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).default('inr'),
  orderId: z.string().uuid('Invalid order ID')
});

export const upiSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  vpa: z.string()
    .regex(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/, 'Invalid UPI VPA')
    .optional(),
  orderId: z.string().uuid('Invalid order ID')
});

export const createPaymentIntentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  gateway: z.enum(['RAZORPAY', 'STRIPE'], {
    errorMap: () => ({ message: 'Invalid payment gateway' })
  })
});
