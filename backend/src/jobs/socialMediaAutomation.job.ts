import { prisma } from '../db/prisma';
import { PostType } from '@prisma/client';
import { generateProductContent, getTrendingProducts } from '../services/social/contentGenerator.service';
import { instagramService } from '../services/social/instagram.service';
import { facebookService } from '../services/social/facebook.service';
import { twitterService } from '../services/social/twitter.service';

/**
 * Main social media automation job
 * Runs 3x daily at optimal US times (5:30 PM, 10:30 PM, 4:30 AM IST)
 */
export async function runSocialMediaAutomationJob(): Promise<void> {
  console.log('[Social Media Automation] Starting job...');

  try {
    // Get all active social media accounts
    const accounts = await prisma.socialMediaAccount.findMany({
      where: { isActive: true },
    });

    if (accounts.length === 0) {
      console.log('[Social Media Automation] No active accounts found');
      return;
    }

    // Get active campaigns
    const campaigns = await prisma.socialMediaCampaign.findMany({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
      },
      include: { account: true },
    });

    if (campaigns.length === 0) {
      console.log('[Social Media Automation] No active campaigns found');
      return;
    }

    // Process each campaign
    for (const campaign of campaigns) {
      await processCampaign(campaign);
    }

    console.log('[Social Media Automation] Job completed successfully');
  } catch (error) {
    console.error('[Social Media Automation] Job failed:', error);
    throw error;
  }
}

/**
 * Process a single campaign
 */
async function processCampaign(campaign: any): Promise<void> {
  console.log(`[Campaign] Processing: ${campaign.name}`);

  try {
    // Get trending products
    const products = await getTrendingProducts(campaign.productCount);

    if (products.length === 0) {
      console.log(`[Campaign] No products found for ${campaign.name}`);
      return;
    }

    // Check how many posts to create today
    const postsToday = await prisma.socialMediaPost.count({
      where: {
        accountId: campaign.accountId,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    const remainingPosts = campaign.postsPerDay - postsToday;

    if (remainingPosts <= 0) {
      console.log(`[Campaign] Daily limit reached for ${campaign.name}`);
      return;
    }

    // Select products that haven't been posted recently (7 days)
    const recentProductIds = await getRecentlyPostedProducts(campaign.accountId, 7);
    const availableProducts = products.filter(p => !recentProductIds.includes(p.id));

    if (availableProducts.length === 0) {
      console.log(`[Campaign] No new products to post for ${campaign.name}`);
      return;
    }

    // Create posts for available products (up to remaining limit)
    const productsToPost = availableProducts.slice(0, remainingPosts);

    for (const product of productsToPost) {
      await createAndPublishPost(campaign, product);
      
      // Wait 2 seconds between posts to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Update campaign stats
    await prisma.socialMediaCampaign.update({
      where: { id: campaign.id },
      data: {
        totalPosts: { increment: productsToPost.length },
        nextRunAt: getNextRunTime(),
      },
    });

    console.log(`[Campaign] Created ${productsToPost.length} posts for ${campaign.name}`);
  } catch (error) {
    console.error(`[Campaign] Failed to process ${campaign.name}:`, error);
  }
}

/**
 * Create and publish a post for a product
 */
async function createAndPublishPost(campaign: any, product: any): Promise<void> {
  try {
    const platform = campaign.account.platform;
    
    // Determine post type based on platform and product
    const postType = determinePostType(platform, product);
    
    // Generate AI content
    const content = await generateProductContent(
      product,
      platform,
      campaign.contentStyle
    );

    // Get product images
    const images = Array.isArray(product.images) ? product.images : [];
    const primaryImage = images[0] || null;

    // Create post in database
    const post = await prisma.socialMediaPost.create({
      data: {
        accountId: campaign.accountId,
        campaignId: campaign.id,
        platform,
        postType: postType as PostType,
        status: 'SCHEDULED',
        caption: content.caption,
        hashtags: content.hashtags,
        mediaUrls: images,
        aiPrompt: `Generated for ${product.title} using ${campaign.contentStyle} style`,
        contentStyle: campaign.contentStyle,
        productIds: [product.id],
        scheduledFor: new Date(),
      },
    });

    console.log(`[Post] Created post ${post.id} for product ${product.title}`);

    // Publish immediately
    await publishPost(post, campaign.account, primaryImage);

  } catch (error) {
    console.error('[Post] Failed to create/publish:', error);
  }
}

/**
 * Publish a post to the platform
 */
async function publishPost(post: any, account: any, imageUrl: string | null): Promise<void> {
  try {
    await prisma.socialMediaPost.update({
      where: { id: post.id },
      data: { status: 'POSTING' },
    });

    let platformPostId: string;
    let platformUrl: string;

    const credentials = {
      accessToken: account.accessToken,
      accountId: account.accountId,
    };

    switch (account.platform) {
      case 'INSTAGRAM':
        if (post.postType === 'REEL' && post.videoUrl) {
          const result = await instagramService.publishReel(
            credentials,
            post.videoUrl,
            post.caption,
            post.hashtags,
            imageUrl || undefined
          );
          platformPostId = result.postId;
          platformUrl = result.permalink;
        } else if (imageUrl) {
          const result = await instagramService.publishPost(
            credentials,
            imageUrl,
            post.caption,
            post.hashtags
          );
          platformPostId = result.postId;
          platformUrl = result.permalink;
        } else {
          throw new Error('Instagram requires image or video');
        }
        break;

      case 'FACEBOOK':
        const fbCredentials = {
          accessToken: account.accessToken,
          pageId: account.accountId,
        };
        
        if (post.videoUrl) {
          const result = await facebookService.publishVideo(
            fbCredentials,
            post.videoUrl,
            post.caption,
            post.hashtags
          );
          platformPostId = result.postId;
          platformUrl = result.permalink;
        } else {
          const result = await facebookService.publishPost(
            fbCredentials,
            post.caption,
            imageUrl || undefined,
            post.hashtags
          );
          platformPostId = result.postId;
          platformUrl = result.permalink;
        }
        break;

      case 'TWITTER':
        if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
          throw new Error('Twitter API credentials not configured in environment variables');
        }
        
        const twitterCredentials = {
          apiKey: process.env.TWITTER_API_KEY,
          apiSecret: process.env.TWITTER_API_SECRET,
          accessToken: account.accessToken,
          accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
          bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
        };

        const twitterResult = await twitterService.publishTweet(
          twitterCredentials,
          post.caption,
          post.hashtags,
          imageUrl ? [imageUrl] : undefined
        );
        platformPostId = twitterResult.tweetId;
        platformUrl = twitterResult.url;
        break;

      case 'REDDIT':
        if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
          throw new Error('Reddit API credentials not configured in environment variables');
        }
        
        const { redditService } = await import('../services/social/reddit.service');
        const { generateRedditContent } = await import('../services/social/contentGenerator.service');
        
        const redditCredentials = {
          clientId: process.env.REDDIT_CLIENT_ID,
          clientSecret: process.env.REDDIT_CLIENT_SECRET,
          username: process.env.REDDIT_USERNAME || '',
          password: process.env.REDDIT_PASSWORD || '',
          accessToken: account.accessToken,
        };

        // Get subreddit from account settings or use default
        const subreddit = account.accountHandle || 'deals';
        
        // Generate Reddit-specific content
        const product = post.productIds && post.productIds.length > 0
          ? await prisma.product.findUnique({ where: { id: post.productIds[0] } })
          : null;

        if (product) {
          const redditContent = await generateRedditContent(
            {
              id: product.id,
              title: product.title,
              price: product.price,
              category: product.category,
              rating: product.rating,
              totalSales: product.totalSales,
              images: Array.isArray(product.imagesJson) ? product.imagesJson as string[] : [],
            },
            subreddit,
            post.contentStyle || 'VIRAL_HOOK'
          );

          // Post to Reddit (text post with image link)
          const redditResult = await redditService.submitTextPost(
            redditCredentials,
            subreddit,
            redditContent.title,
            redditContent.text + `\n\n[Product Link](${process.env.NEXT_PUBLIC_APP_URL}/products/${product.slug})`
          );
          
          platformPostId = redditResult.id;
          platformUrl = redditResult.permalink;
        } else {
          throw new Error('Reddit requires product data');
        }
        break;

      default:
        throw new Error(`Unsupported platform: ${account.platform}`);
    }

    // Update post as published
    await prisma.socialMediaPost.update({
      where: { id: post.id },
      data: {
        status: 'PUBLISHED',
        platformPostId,
        platformUrl,
        publishedAt: new Date(),
      },
    });

    console.log(`[Post] Published ${post.id} to ${account.platform}: ${platformUrl}`);

  } catch (error: any) {
    console.error('[Post] Publish failed:', error);

    // Mark as failed
    await prisma.socialMediaPost.update({
      where: { id: post.id },
      data: {
        status: 'FAILED',
        errorMessage: error.message,
      },
    });
  }
}

/**
 * Determine post type based on platform and product
 */
function determinePostType(platform: string, product: any): string {
  if (platform === 'INSTAGRAM') {
    // 50% reels, 50% posts for Instagram
    return Math.random() > 0.5 ? 'REEL' : 'POST';
  } else if (platform === 'FACEBOOK') {
    return 'POST';
  } else if (platform === 'TWITTER') {
    return 'TWEET';
  }
  return 'POST';
}

/**
 * Get recently posted product IDs
 */
async function getRecentlyPostedProducts(accountId: string, days: number): Promise<string[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const posts = await prisma.socialMediaPost.findMany({
    where: {
      accountId,
      createdAt: { gte: cutoffDate },
      status: 'PUBLISHED',
    },
    select: { productIds: true },
  });

  const productIds = new Set<string>();
  posts.forEach(post => {
    post.productIds.forEach(id => productIds.add(id));
  });

  return Array.from(productIds);
}

/**
 * Get next run time (next scheduled posting time)
 */
function getNextRunTime(): Date {
  const now = new Date();
  const postingTimes = ['17:30', '22:30', '04:30']; // IST times

  for (const time of postingTimes) {
    const [hours, minutes] = time.split(':').map(Number);
    const nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    if (nextRun > now) {
      return nextRun;
    }
  }

  // If all times passed today, return first time tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [hours, minutes] = postingTimes[0].split(':').map(Number);
  tomorrow.setHours(hours, minutes, 0, 0);
  return tomorrow;
}

/**
 * Sync analytics for published posts
 */
export async function syncSocialMediaAnalytics(): Promise<void> {
  console.log('[Analytics Sync] Starting...');

  try {
    // Get posts published in last 7 days that need analytics update
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    const posts = await prisma.socialMediaPost.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { gte: cutoffDate },
        OR: [
          { lastAnalyticsSync: null },
          { lastAnalyticsSync: { lt: new Date(Date.now() - 6 * 60 * 60 * 1000) } }, // 6 hours ago
        ],
      },
      include: { account: true },
      take: 50, // Limit to avoid rate limits
    });

    console.log(`[Analytics Sync] Syncing ${posts.length} posts`);

    for (const post of posts) {
      await syncPostAnalytics(post);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
    }

    console.log('[Analytics Sync] Completed');
  } catch (error) {
    console.error('[Analytics Sync] Failed:', error);
  }
}

/**
 * Sync analytics for a single post
 */
async function syncPostAnalytics(post: any): Promise<void> {
  try {
    if (!post.platformPostId) return;

    const credentials = {
      accessToken: post.account.accessToken,
      accountId: post.account.accountId,
    };

    let analytics: any;

    switch (post.platform) {
      case 'INSTAGRAM':
        analytics = await instagramService.getPostAnalytics(credentials, post.platformPostId);
        break;

      case 'FACEBOOK':
        const fbCreds = { ...credentials, pageId: credentials.accountId };
        analytics = await facebookService.getPostInsights(fbCreds, post.platformPostId);
        break;

      case 'TWITTER':
        const twitterCreds = {
          apiKey: process.env.TWITTER_API_KEY!,
          apiSecret: process.env.TWITTER_API_SECRET!,
          accessToken: credentials.accessToken,
          accessSecret: process.env.TWITTER_ACCESS_SECRET!,
          bearerToken: process.env.TWITTER_BEARER_TOKEN!,
        };
        analytics = await twitterService.getTweetMetrics(twitterCreds, post.platformPostId);
        break;

      default:
        return;
    }

    // Calculate engagement rate
    const totalEngagement = (analytics.likes || 0) + (analytics.comments || 0) + (analytics.shares || 0);
    const engagementRate = analytics.reach > 0 ? (totalEngagement / analytics.reach) * 100 : 0;

    // Update post analytics
    await prisma.socialMediaPost.update({
      where: { id: post.id },
      data: {
        views: analytics.impressions || 0,
        likes: analytics.likes || 0,
        comments: analytics.comments || 0,
        shares: analytics.shares || analytics.retweets || 0,
        saves: analytics.saves || 0,
        reach: analytics.reach || 0,
        engagement: engagementRate,
        lastAnalyticsSync: new Date(),
      },
    });

    console.log(`[Analytics] Updated post ${post.id}: ${analytics.likes} likes, ${analytics.reach} reach`);
  } catch (error) {
    console.error(`[Analytics] Failed to sync post ${post.id}:`, error);
  }
}
