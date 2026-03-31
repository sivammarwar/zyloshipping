import { z } from 'zod';

export const createSocialAccountSchema = z.object({
  platform: z.enum(['INSTAGRAM', 'FACEBOOK', 'TWITTER']),
  accountName: z.string().min(1, 'Account name is required'),
  accountHandle: z.string().min(1, 'Account handle is required'),
  accountId: z.string().optional(),
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().optional(),
  targetRegion: z.string().default('US'),
  postingTimezone: z.string().default('America/New_York'),
  postsPerDay: z.number().int().min(1).max(10).default(3)
});

export const updateSocialAccountSchema = z.object({
  isActive: z.boolean().optional(),
  targetRegion: z.string().optional(),
  postingTimezone: z.string().optional(),
  postingTimes: z.array(z.string()).optional(),
  postsPerDay: z.number().int().min(1).max(10).optional()
});

export const generatePostSchema = z.object({
  productIds: z.array(z.string()).optional(),
  platform: z.enum(['INSTAGRAM', 'FACEBOOK', 'TWITTER']),
  contentStyle: z.enum(['VIRAL_HOOK', 'EDUCATIONAL', 'PROMOTIONAL', 'STORYTELLING', 'TRENDING', 'CONTROVERSIAL']).default('VIRAL_HOOK'),
  count: z.number().int().min(1).max(10).default(5)
});

export const createCampaignSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  name: z.string().min(1, 'Campaign name is required'),
  description: z.string().optional(),
  targetRegion: z.string().default('US'),
  contentStyle: z.enum(['VIRAL_HOOK', 'EDUCATIONAL', 'PROMOTIONAL', 'STORYTELLING', 'TRENDING', 'CONTROVERSIAL']).default('VIRAL_HOOK'),
  postsPerDay: z.number().int().min(1).max(10).default(3),
  productCount: z.number().int().min(1).max(20).default(10),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().optional().transform(str => str ? new Date(str) : null)
});

export const updateCampaignSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  contentStyle: z.enum(['VIRAL_HOOK', 'EDUCATIONAL', 'PROMOTIONAL', 'STORYTELLING', 'TRENDING', 'CONTROVERSIAL']).optional(),
  postsPerDay: z.number().int().min(1).max(10).optional()
});
