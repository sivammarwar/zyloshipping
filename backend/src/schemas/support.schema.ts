import { z } from 'zod';

export const supportChatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
  orderId: z.string().uuid('Invalid order ID').optional()
});

export const supportTicketSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
  orderId: z.string().uuid('Invalid order ID').optional()
});
