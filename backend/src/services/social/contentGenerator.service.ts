import Groq from 'groq-sdk';
import { prisma } from '../../db/prisma';

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  rating: number;
  totalSales: number;
  images: string[];
}

interface GeneratedContent {
  caption: string;
  hashtags: string[];
  hook: string;
  cta: string;
  style: string;
}

// US-focused viral hooks for different content styles
const VIRAL_HOOKS = {
  VIRAL_HOOK: [
    "Nobody tells you this about {product}...",
    "This is why Americans are obsessed with {product}",
    "POV: You just discovered {product} in the US 🇺🇸",
    "Stop scrolling. This {product} will change your life",
    "If you live in the US, you NEED this {product}",
    "This {product} is going viral in America right now",
    "Americans are going crazy over this {product}",
    "The {product} that broke the internet in 2026",
  ],
  EDUCATIONAL: [
    "Here's what you need to know about {product}",
    "5 reasons why {product} is trending in the US",
    "Everything you need to know about {product}",
    "The truth about {product} nobody talks about",
    "How {product} actually works (explained)",
  ],
  PROMOTIONAL: [
    "Limited time: Get {product} before it's gone",
    "This {product} is on sale RIGHT NOW",
    "Don't miss out on {product} - US shipping available",
    "Exclusive deal on {product} for US customers",
  ],
  STORYTELLING: [
    "I tried {product} for 30 days. Here's what happened...",
    "My life before and after {product}",
    "How {product} saved me $1000 this year",
    "The day I discovered {product} changed everything",
  ],
  TRENDING: [
    "Everyone in the US is talking about {product}",
    "The {product} trend taking over America",
    "Why {product} is trending on TikTok right now",
    "This {product} is everywhere in the US",
  ],
  CONTROVERSIAL: [
    "Unpopular opinion: {product} is overrated (or is it?)",
    "The {product} debate: Let's settle this once and for all",
    "Why some people hate {product} (they're wrong)",
    "Hot take: {product} is actually worth the hype",
  ],
};

// US-specific hashtags for maximum reach
const US_HASHTAGS = {
  general: ['usa', 'america', 'uslife', 'americandream', 'madeinusa', 'shopusa', 'usashopping', 'americanstyle'],
  viral: ['viral', 'trending', 'foryou', 'fyp', 'explore', 'viralvideos', 'trendingnow'],
  ecommerce: ['onlineshopping', 'shopnow', 'deals', 'sale', 'shopping', 'shoplocal', 'supportsmallbusiness'],
  lifestyle: ['lifestyle', 'lifehack', 'musthave', 'productreview', 'amazonfinds', 'tiktokmademebuyit'],
  cities: ['newyork', 'losangeles', 'chicago', 'houston', 'miami', 'seattle', 'boston', 'atlanta'],
};

/**
 * Generate Reddit post title and content
 */
export async function generateRedditContent(
  product: Product,
  subreddit: string,
  contentStyle: string = 'VIRAL_HOOK'
): Promise<{
  title: string;
  text: string;
  subreddit: string;
}> {
  if (!groq) {
    throw new Error('Groq API not configured');
  }

  const prompt = `You are a Reddit power user creating engaging posts for r/${subreddit}.

Product Details:
- Name: ${product.title}
- Price: $${product.price}
- Category: ${product.category}
- Rating: ${product.rating}/5 (${product.totalSales} sales)

Subreddit: r/${subreddit}
Content Style: ${contentStyle}

Create a Reddit post that will get upvotes and engagement. Follow Reddit culture and etiquette.

Requirements:
1. Title must be attention-grabbing but NOT clickbait
2. Keep title under 300 characters
3. Write authentic, helpful content (not overly promotional)
4. Use Reddit-style language (casual, informative)
5. Include value proposition clearly
6. Add product benefits naturally
7. NO emojis (Reddit culture)
8. Be genuine and conversational

Format your response as JSON:
{
  "title": "The post title",
  "text": "The post body text (can be longer, provide real value)",
  "tone": "The tone used"
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a Reddit expert who understands US subreddit culture. Output only valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 800,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(responseText);

    return {
      title: parsed.title || `Check out this ${product.title}`,
      text: parsed.text || `I've been using this ${product.title} and it's been great. Highly recommend for anyone looking for quality ${product.category} products. Price: $${product.price}`,
      subreddit,
    };
  } catch (error) {
    console.error('[Reddit Content Generator] AI generation failed:', error);
    
    // Fallback to template
    return {
      title: `[Review] ${product.title} - Worth the $${product.price}?`,
      text: `I recently got this ${product.title} and wanted to share my experience.\n\nPros:\n- High quality ${product.category}\n- Great value at $${product.price}\n- ${product.rating}/5 stars from ${product.totalSales}+ customers\n\nOverall, I'd recommend it if you're looking for a reliable ${product.category} product.`,
      subreddit,
    };
  }
}

/**
 * Generate viral content for a product targeting US audience
 */
export async function generateProductContent(
  product: Product,
  platform: 'INSTAGRAM' | 'FACEBOOK' | 'TWITTER' | 'REDDIT',
  contentStyle: string = 'VIRAL_HOOK'
): Promise<GeneratedContent> {
  if (!groq) {
    throw new Error('Groq API not configured');
  }

  const hooks = VIRAL_HOOKS[contentStyle as keyof typeof VIRAL_HOOKS] || VIRAL_HOOKS.VIRAL_HOOK;
  const selectedHook = hooks[Math.floor(Math.random() * hooks.length)].replace('{product}', product.title);

  const prompt = `You are a viral social media content creator specializing in US audience engagement.

Product Details:
- Name: ${product.title}
- Price: $${product.price}
- Category: ${product.category}
- Rating: ${product.rating}/5 (${product.totalSales} sales)

Platform: ${platform}
Content Style: ${contentStyle}
Hook: ${selectedHook}

Create viral content that will resonate with US audience (ages 18-45). Use American English, slang, and cultural references.

Requirements:
1. Use the hook as the opening line
2. Keep it SHORT and punchy (${platform === 'TWITTER' ? '280 chars max' : '150 words max'})
3. Include emotional trigger (FOMO, curiosity, excitement)
4. Add US-specific context (shipping, pricing in USD, US trends)
5. Strong call-to-action
6. Use casual, conversational tone
7. NO emojis in main text (we'll add them separately)

Format your response as JSON:
{
  "caption": "The main caption text",
  "cta": "Call to action (e.g., 'Link in bio', 'Shop now', 'Tag a friend')",
  "tone": "The emotional tone used"
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a viral content creator who understands US social media trends. Output only valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.9,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(responseText);

    // Generate platform-specific hashtags
    const hashtags = generateHashtags(product, platform, contentStyle);

    // Combine hook + caption
    const fullCaption = `${selectedHook}\n\n${parsed.caption}\n\n${parsed.cta}`;

    return {
      caption: fullCaption,
      hashtags,
      hook: selectedHook,
      cta: parsed.cta || 'Link in bio 🔗',
      style: parsed.tone || contentStyle,
    };
  } catch (error) {
    console.error('[Content Generator] AI generation failed:', error);
    
    // Fallback to template-based content
    return generateFallbackContent(product, platform, selectedHook);
  }
}

/**
 * Generate platform-optimized hashtags
 */
function generateHashtags(
  product: Product,
  platform: 'INSTAGRAM' | 'FACEBOOK' | 'TWITTER' | 'REDDIT',
  contentStyle: string
): string[] {
  const maxHashtags = platform === 'INSTAGRAM' ? 30 : platform === 'TWITTER' ? 5 : 10;
  
  const hashtags = new Set<string>();
  
  // Add US location hashtags (2-3)
  const cityHashtags = US_HASHTAGS.cities.sort(() => 0.5 - Math.random()).slice(0, 2);
  cityHashtags.forEach(tag => hashtags.add(tag));
  
  // Add general US hashtags (3-4)
  US_HASHTAGS.general.slice(0, 3).forEach(tag => hashtags.add(tag));
  
  // Add viral hashtags (3-4)
  US_HASHTAGS.viral.slice(0, 3).forEach(tag => hashtags.add(tag));
  
  // Add ecommerce hashtags (2-3)
  US_HASHTAGS.ecommerce.slice(0, 2).forEach(tag => hashtags.add(tag));
  
  // Add lifestyle hashtags (2-3)
  US_HASHTAGS.lifestyle.slice(0, 2).forEach(tag => hashtags.add(tag));
  
  // Add product-specific hashtags
  const productHashtags = [
    product.category.toLowerCase().replace(/\s+/g, ''),
    product.title.toLowerCase().split(' ')[0],
    `${product.category.toLowerCase()}lover`,
  ];
  productHashtags.forEach(tag => hashtags.add(tag));
  
  // Convert to array and limit
  return Array.from(hashtags).slice(0, maxHashtags);
}

/**
 * Fallback content generation (template-based)
 */
function generateFallbackContent(
  product: Product,
  platform: string,
  hook: string
): GeneratedContent {
  const caption = `${hook}

This ${product.title} is taking the US by storm! With a ${product.rating}/5 rating and ${product.totalSales}+ happy customers, it's the must-have item of 2026.

✨ Premium quality
🚚 Fast US shipping
💰 Only $${product.price}

Don't miss out on this game-changer!

Link in bio 🔗`;

  const hashtags = generateHashtags(product, platform as any, 'VIRAL_HOOK');

  return {
    caption,
    hashtags,
    hook,
    cta: 'Link in bio 🔗',
    style: 'VIRAL_HOOK',
  };
}

/**
 * Generate reel script for video content
 */
export async function generateReelScript(product: Product): Promise<{
  script: string;
  scenes: Array<{ duration: number; description: string; text: string }>;
  music: string;
}> {
  if (!groq) {
    throw new Error('Groq API not configured');
  }

  const prompt = `Create a viral 15-second Instagram Reel script for US audience.

Product: ${product.title}
Price: $${product.price}
Category: ${product.category}

Create a fast-paced, attention-grabbing reel with:
1. Hook in first 2 seconds
2. Problem → Solution format
3. US-specific context
4. Strong visual cues
5. Trending music suggestion

Format as JSON:
{
  "script": "Full narration script",
  "scenes": [
    {"duration": 2, "description": "Visual description", "text": "On-screen text"},
    ...
  ],
  "music": "Trending song suggestion"
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a viral reel creator. Output only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.9,
      max_tokens: 800,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    return JSON.parse(responseText);
  } catch (error) {
    console.error('[Reel Generator] Failed:', error);
    
    // Fallback reel script
    return {
      script: `Stop scrolling! This ${product.title} is going viral in the US. Only $${product.price}. Link in bio!`,
      scenes: [
        { duration: 2, description: 'Product showcase', text: 'STOP SCROLLING 🛑' },
        { duration: 3, description: 'Problem demonstration', text: 'Tired of...' },
        { duration: 5, description: 'Product in action', text: `Meet ${product.title}` },
        { duration: 3, description: 'Results/benefits', text: 'Game changer! 🔥' },
        { duration: 2, description: 'CTA', text: 'Link in bio 🔗' },
      ],
      music: 'Trending upbeat track',
    };
  }
}

/**
 * Get trending products for content generation
 */
export async function getTrendingProducts(limit: number = 10): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: {
      status: { in: ['ACTIVE', 'LOW'] },
      stockQuantity: { gt: 0 },
    },
    orderBy: [
      { totalSales: 'desc' },
      { rating: 'desc' },
    ],
    take: limit,
    select: {
      id: true,
      title: true,
      price: true,
      category: true,
      rating: true,
      totalSales: true,
      imagesJson: true,
    },
  });

  return products.map(p => ({
    ...p,
    images: Array.isArray(p.imagesJson) ? (p.imagesJson as string[]) : [],
  })) as unknown as Product[];
}

/**
 * Calculate optimal posting time for US audience (in IST)
 */
export function getOptimalPostingTimes(timezone: string = 'America/New_York'): string[] {
  // Best US times: 7-9 AM EST, 12-1 PM EST, 6-9 PM EST
  // Convert to IST (EST + 10:30 hours)
  
  return [
    '17:30', // 7 AM EST = 5:30 PM IST
    '18:00', // 7:30 AM EST = 6:00 PM IST
    '22:30', // 12 PM EST = 10:30 PM IST
    '04:30', // 6 PM EST = 4:30 AM IST (next day)
    '05:00', // 6:30 PM EST = 5:00 AM IST (next day)
  ];
}
