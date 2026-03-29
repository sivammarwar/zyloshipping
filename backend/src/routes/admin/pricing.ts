import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { adminAuth } from '../../middleware/auth';

const router = Router();

// Validation schemas
const createPlanSchema = z.object({
  planId: z.string().min(1),
  name: z.string().min(1),
  tagline: z.string().min(1),
  monthlyPrice: z.number().int().min(0),
  annualPrice: z.number().int().min(0),
  isHighlight: z.boolean().default(false),
  badge: z.string().optional(),
  ctaText: z.string().min(1),
  features: z.array(z.string()),
  limits: z.array(z.string()),
  displayOrder: z.number().int().default(0),
});

const updatePlanSchema = createPlanSchema.partial();

// GET /api/admin/pricing - List all pricing plans
router.get('/', async (req, res) => {
  try {
    const plans = await prisma.pricingPlan.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    res.json({ plans });
  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    res.status(500).json({ error: 'Failed to fetch pricing plans' });
  }
});

// GET /api/admin/pricing/:id - Get single plan
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const plan = await prisma.pricingPlan.findUnique({
      where: { id: req.params.id },
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json({ plan });
  } catch (error) {
    console.error('Error fetching pricing plan:', error);
    res.status(500).json({ error: 'Failed to fetch pricing plan' });
  }
});

// POST /api/admin/pricing - Create new plan
router.post('/', adminAuth, async (req, res) => {
  try {
    const data = createPlanSchema.parse(req.body);

    const plan = await prisma.pricingPlan.create({
      data: {
        planId: data.planId,
        name: data.name,
        tagline: data.tagline,
        monthlyPrice: data.monthlyPrice,
        annualPrice: data.annualPrice,
        isHighlight: data.isHighlight,
        badge: data.badge,
        ctaText: data.ctaText,
        features: data.features,
        limits: data.limits,
        displayOrder: data.displayOrder,
      },
    });

    res.status(201).json({ plan });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating pricing plan:', error);
    res.status(500).json({ error: 'Failed to create pricing plan' });
  }
});

// PUT /api/admin/pricing/:id - Update plan
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const data = updatePlanSchema.parse(req.body);

    const plan = await prisma.pricingPlan.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ plan });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating pricing plan:', error);
    res.status(500).json({ error: 'Failed to update pricing plan' });
  }
});

// DELETE /api/admin/pricing/:id - Delete plan
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await prisma.pricingPlan.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting pricing plan:', error);
    res.status(500).json({ error: 'Failed to delete pricing plan' });
  }
});

export default router;
