import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number()
    .int('Quantity must be a whole number')
    .min(1, 'Minimum quantity is 1')
    .max(100, 'Maximum quantity is 100')
});

export const updateCartSchema = z.object({
  quantity: z.number()
    .int('Quantity must be a whole number')
    .min(1, 'Minimum quantity is 1')
    .max(100, 'Maximum quantity is 100')
});

export const couponSchema = z.object({
  code: z.string()
    .min(1, 'Coupon code is required')
    .max(20, 'Coupon code too long')
    .transform(val => val.toUpperCase())
});

// Admin cart schemas
export const adminAddToCartSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().min(1, 'Minimum quantity is 1')
});

export const adminUpdateCartItemSchema = z.object({
  quantity: z.number().int().min(1).optional(),
  savedForLater: z.boolean().optional()
});

export const adminCheckoutSchema = z.object({
  shippingAddress: z.record(z.any()),
  couponCode: z.string().optional(),
  note: z.string().max(500, 'Note too long').optional()
});
