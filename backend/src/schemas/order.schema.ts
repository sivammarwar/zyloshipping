import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().min(1).max(100)
  })).min(1, 'Order must have at least one item'),
  shippingAddress: z.object({
    name: z.string().min(2, 'Name too short').max(100),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
    address: z.string().min(10, 'Address too short').max(500),
    city: z.string().min(2).max(100),
    state: z.string().min(2).max(100),
    pincode: z.string().regex(/^\d{6}$/, 'Invalid 6-digit pincode'),
    country: z.string().default('India')
  }),
  paymentMethod: z.enum(['RAZORPAY', 'STRIPE', 'UPI'], {
    errorMap: () => ({ message: 'Invalid payment method' })
  })
});

export const refundSchema = z.object({
  reason: z.string()
    .min(10, 'Please provide more detail (min 10 characters)')
    .max(500, 'Reason too long (max 500 characters)')
});

export const cancelOrderSchema = z.object({
  reason: z.string()
    .min(5, 'Please provide a reason (min 5 characters)')
    .max(200, 'Reason too long (max 200 characters)')
    .optional()
});
