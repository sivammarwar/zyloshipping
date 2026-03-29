import { z } from 'zod';
import { ProductStatus, OrderStatus } from '@prisma/client';

export const updateProductSchema = z.object({
  title: z.string().min(5, 'Title too short').max(200, 'Title too long').optional(),
  description: z.string().max(5000, 'Description too long').optional(),
  price: z.number().positive('Price must be positive').optional(),
  status: z.nativeEnum(ProductStatus, {
    errorMap: () => ({ message: 'Invalid product status' })
  }).optional(),
  stockQuantity: z.number().int('Stock must be a whole number').min(0, 'Stock cannot be negative').optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided'
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus, {
    errorMap: () => ({ message: 'Invalid order status' })
  })
});

export const adminRefundSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  reason: z.string().min(5, 'Reason too short').max(200, 'Reason too long')
});

export const createProductSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().max(5000),
  price: z.number().positive(),
  supplierId: z.string().min(1),
  supplierSku: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const bulkUpdateProductsSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1, 'At least one product ID required'),
  updates: z.object({
    status: z.nativeEnum(ProductStatus).optional(),
    price: z.number().positive().optional()
  })
});
