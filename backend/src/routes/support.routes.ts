import { Router, Response } from 'express';
import { z } from 'zod';
import { TicketStatus } from '@prisma/client';
import { prisma } from '../db/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { runCustomerSupportAgent } from '../agents/customerSupport.agent';

const router = Router();

// ── POST /api/support/chat ────────────────────────────────────
router.post('/chat', authMiddleware, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    message: z.string().min(1, 'Message is required'),
    orderId: z.string().optional(),
  });
  
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  try {
    // Fetch user's recent orders for context
    const recentOrders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        createdAt: true,
      },
    });

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { name: true, email: true },
    });

    // Build context for AI
    const context = {
      userName: user?.name || 'Customer',
      userEmail: user?.email || '',
      recentOrders: recentOrders.map(o => ({
        orderNumber: o.orderNumber,
        status: o.status,
        amount: o.totalAmount,
        date: o.createdAt,
      })),
      policies: {
        returns: '7-day return policy on most items',
        freeShipping: 'Free shipping on orders over ₹999',
        deliveryTime: 'Typical delivery: 7-14 business days',
      },
      message: parsed.data.message,
      orderId: parsed.data.orderId,
    };

    // Call Customer Support Agent
    const startTime = Date.now();
    const aiResult = await runCustomerSupportAgent(context);
    const responseTime = Date.now() - startTime;

    console.log(`[Support Chat] Response generated in ${responseTime}ms`);

    // Determine if human escalation is needed
    const requiresHuman = aiResult.requiresHuman || false;
    let ticketId: string | null = null;

    // Create or update support ticket
    if (requiresHuman) {
      const count = await prisma.supportTicket.count();
      const ticketNumber = `#${2841 + count}`;
      
      const ticket = await prisma.supportTicket.create({
        data: {
          ticketNumber,
          userId: req.user!.id,
          orderId: parsed.data.orderId,
          message: parsed.data.message,
          aiResponse: aiResult.reply,
          status: TicketStatus.ESCALATED,
        },
      });
      
      ticketId = ticket.id;

      // TODO: Send email notification to admin
      console.log(`[Support] Ticket ${ticketNumber} escalated to human support`);
    } else {
      // Save conversation to support_tickets for history
      const count = await prisma.supportTicket.count();
      const ticketNumber = `#${2841 + count}`;
      
      const ticket = await prisma.supportTicket.create({
        data: {
          ticketNumber,
          userId: req.user!.id,
          orderId: parsed.data.orderId,
          message: parsed.data.message,
          aiResponse: aiResult.reply,
          status: TicketStatus.RESOLVED,
        },
      });
      
      ticketId = ticket.id;
    }

    res.json({
      reply: aiResult.reply,
      ticketId,
      requiresHuman,
      responseTime,
    });
  } catch (error) {
    console.error('[Support Chat] Error:', error);
    res.status(500).json({
      error: 'Failed to process chat message',
      reply: 'I apologize, but I\'m having trouble right now. Please try again or contact our support team directly.',
      requiresHuman: true,
    });
  }
});

// ── GET /api/support/chat/history ─────────────────────────────
router.get('/chat/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const messages = await prisma.supportTicket.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        ticketNumber: true,
        message: true,
        aiResponse: true,
        status: true,
        createdAt: true,
        orderId: true,
      },
    });

    // Group by conversation (for now, each ticket is a conversation)
    const conversations = messages.map(msg => ({
      ticketId: msg.id,
      ticketNumber: msg.ticketNumber,
      userMessage: msg.message,
      aiReply: msg.aiResponse,
      status: msg.status,
      timestamp: msg.createdAt,
      orderId: msg.orderId,
    }));

    res.json({ conversations, total: messages.length });
  } catch (error) {
    console.error('[Support Chat] Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

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
    // Get user info for context
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { name: true, email: true },
    });

    const result = await runCustomerSupportAgent({
      userName: user?.name || 'Customer',
      userEmail: user?.email || '',
      recentOrders: [],
      policies: {
        returns: '7-day return policy',
        freeShipping: 'Free shipping over ₹999',
        deliveryTime: '7-14 business days',
      },
      message: parsed.data.message,
      orderId: parsed.data.orderId,
    });
    aiResponse = result.reply;
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
