import { Request, Response } from 'express';
import { prisma } from '../../db/prisma';

// GET /api/admin/settings - Get store settings
export async function getSettings(req: Request, res: Response) {
  try {
    const settings = await prisma.storeSettings.findUnique({
      where: { id: 'singleton' }
    });

    if (!settings) {
      // Create default settings if not exists
      const defaultSettings = await prisma.storeSettings.create({
        data: { id: 'singleton' }
      });
      return res.json(defaultSettings);
    }

    res.json(settings);
  } catch (error) {
    console.error('[settings] Failed to get settings:', error);
    res.status(500).json({ error: 'Failed to load settings' });
  }
}

// PUT /api/admin/settings - Update store settings
export async function updateSettings(req: Request, res: Response) {
  try {
    const data = req.body;

    const settings = await prisma.storeSettings.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        ...data
      },
      update: data
    });

    res.json({ success: true, settings });
  } catch (error) {
    console.error('[settings] Failed to update settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
}
