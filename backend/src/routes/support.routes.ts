import { Router, Response } from 'express';
import { z } from 'zod';
import { TicketStatus } from '@prisma/client';
import { prisma } from '../db/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { runCustomerSupportAgent } from '../agents/customerSupport.agent';

const router = Router();

router.post('/ticket', authMiddleware, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    message: z.string().min(1),
    orderId: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const count = await prisma.supportTicket.count();
  const ticketNumber = `#${2841 + count}`;

  let aiResponse: string | null = null;
  try {
    aiResponse = await runCustomerSupportAgent({
      message: parsed.data.message,
      userId: req.user!.id,
      orderId: parsed.data.orderId,
    });
  } catch {
    aiResponse = 'Thanks for contacting us. A human agent will follow up shortly.';
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber,
      userId: req.user!.id,
      orderId: parsed.data.orderId,
      message: parsed.data.message,
      aiResponse,
      status: TicketStatus.OPEN,
    },
  });

  res.status(201).json({ ticket });
});

router.get('/tickets', authMiddleware, async (req: AuthRequest, res: Response) => {
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ tickets });
});

router.get('/tickets/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!ticket) return res.status(404).json({ error: 'Not found' });
  res.json({ ticket });
});

export default router;
