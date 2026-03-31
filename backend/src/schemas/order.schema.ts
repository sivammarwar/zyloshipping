import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().min(1).max(100)
  })).min(1, 'Order must have at least one item'),
  shippingAddress: z.record(z.any()),
  couponCode: z.string().optional(),
  note: z.string().max(500, 'Note too long').optional(),
  isAdminOrder: z.boolean().optional()
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

export const bulkOrderUpdateSchema = z.object({
  orderNumbers: z.array(z.string().min(1)).min(1, 'At least one order number required'),
  status: z.nativeEnum(OrderStatus)
});
