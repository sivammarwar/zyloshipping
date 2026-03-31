import axios from 'axios';
import { prisma } from '../../db/prisma';

interface InstagramCredentials {
  accessToken: string;
  accountId: string;
}

interface InstagramMediaResponse {
  id: string;
  permalink: string;
}

/**
 * Instagram Graph API integration for automated posting
 * Supports: Posts, Reels, Stories
 */
export class InstagramService {
  private baseUrl = 'https://graph.facebook.com/v18.0';

  /**
   * Publish an Instagram post (image + caption)
   */
  async publishPost(
    credentials: InstagramCredentials,
    imageUrl: string,
    caption: string,
    hashtags: string[]
  ): Promise<{ postId: string; permalink: string }> {
    try {
      const fullCaption = `${caption}\n\n${hashtags.map(tag => `#${tag}`).join(' ')}`;

      // Step 1: Create media container
      const containerResponse = await axios.post(
        `${this.baseUrl}/${credentials.accountId}/media`,
        {
          image_url: imageUrl,
          caption: fullCaption,
          access_token: credentials.accessToken,
        }
      );

      const containerId = containerResponse.data.id;

      // Step 2: Publish the container
      const publishResponse = await axios.post(
        `${this.baseUrl}/${credentials.accountId}/media_publish`,
        {
          creation_id: containerId,
          access_token: credentials.accessToken,
        }
      );

      const postId = publishResponse.data.id;

      // Step 3: Get permalink
      const mediaResponse = await axios.get(
        `${this.baseUrl}/${postId}`,
        {
          params: {
            fields: 'permalink',
            access_token: credentials.accessToken,
          },
        }
      );

      return {
        postId,
        permalink: mediaResponse.data.permalink,
      };
    } catch (error: any) {
      console.error('[Instagram] Post failed:', error.response?.data || error.message);
      throw new Error(`Instagram post failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Publish an Instagram Reel (video)
   */
  async publishReel(
    credentials: InstagramCredentials,
    videoUrl: string,
    caption: string,
    hashtags: string[],
    thumbnailUrl?: string
  ): Promise<{ postId: string; permalink: string }> {
    try {
      const fullCaption = `${caption}\n\n${hashtags.map(tag => `#${tag}`).join(' ')}`;

      // Step 1: Create reel container
      const containerData: any = {
        media_type: 'REELS',
        video_url: videoUrl,
        caption: fullCaption,
        share_to_feed: true, // Also post to main feed
        access_token: credentials.accessToken,
      };

      if (thumbnailUrl) {
        containerData.thumb_offset = 0; // Thumbnail from video start
      }

      const containerResponse = await axios.post(
        `${this.baseUrl}/${credentials.accountId}/media`,
        containerData
      );

      const containerId = containerResponse.data.id;

      // Step 2: Wait for processing (reels take longer)
      await this.waitForMediaProcessing(credentials, containerId);

      // Step 3: Publish the reel
      const publishResponse = await axios.post(
        `${this.baseUrl}/${credentials.accountId}/media_publish`,
        {
          creation_id: containerId,
          access_token: credentials.accessToken,
        }
      );

      const postId = publishResponse.data.id;

      // Step 4: Get permalink
      const mediaResponse = await axios.get(
        `${this.baseUrl}/${postId}`,
        {
          params: {
            fields: 'permalink',
            access_token: credentials.accessToken,
          },
        }
      );

      return {
        postId,
        permalink: mediaResponse.data.permalink,
      };
    } catch (error: any) {
      console.error('[Instagram] Reel failed:', error.response?.data || error.message);
      throw new Error(`Instagram reel failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Wait for media processing to complete
   */
  private async waitForMediaProcessing(
    credentials: InstagramCredentials,
    containerId: string,
    maxAttempts: number = 10
  ): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const statusResponse = await axios.get(
        `${this.baseUrl}/${containerId}`,
        {
          params: {
            fields: 'status_code',
            access_token: credentials.accessToken,
          },
        }
      );

      const statusCode = statusResponse.data.status_code;

      if (statusCode === 'FINISHED') {
        return;
      } else if (statusCode === 'ERROR') {
        throw new Error('Media processing failed');
      }

      // Wait 5 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    throw new Error('Media processing timeout');
  }

  /**
   * Get post analytics
   */
  async getPostAnalytics(
    credentials: InstagramCredentials,
    postId: string
  ): Promise<{
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    reach: number;
    impressions: number;
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${postId}/insights`,
        {
          params: {
            metric: 'likes,comments,shares,saved,reach,impressions',
            access_token: credentials.accessToken,
          },
        }
      );

      const metrics = response.data.data.reduce((acc: any, item: any) => {
        acc[item.name] = item.values[0]?.value || 0;
        return acc;
      }, {});

      return {
        likes: metrics.likes || 0,
        comments: metrics.comments || 0,
        shares: metrics.shares || 0,
        saves: metrics.saved || 0,
        reach: metrics.reach || 0,
        impressions: metrics.impressions || 0,
      };
    } catch (error: any) {
      console.error('[Instagram] Analytics failed:', error.response?.data || error.message);
      return {
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        reach: 0,
        impressions: 0,
      };
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/oauth/access_token`,
        {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: process.env.FACEBOOK_APP_ID,
            client_secret: process.env.FACEBOOK_APP_SECRET,
            fb_exchange_token: refreshToken,
          },
        }
      );

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error: any) {
      console.error('[Instagram] Token refresh failed:', error.response?.data || error.message);
      throw new Error('Failed to refresh Instagram access token');
    }
  }

  /**
   * Get account insights
   */
  async getAccountInsights(
    credentials: InstagramCredentials,
    period: 'day' | 'week' | 'days_28' = 'day'
  ): Promise<{
    followerCount: number;
    reach: number;
    impressions: number;
    profileViews: number;
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${credentials.accountId}/insights`,
        {
          params: {
            metric: 'follower_count,reach,impressions,profile_views',
            period,
            access_token: credentials.accessToken,
          },
        }
      );

      const metrics = response.data.data.reduce((acc: any, item: any) => {
        acc[item.name] = item.values[0]?.value || 0;
        return acc;
      }, {});

      return {
        followerCount: metrics.follower_count || 0,
        reach: metrics.reach || 0,
        impressions: metrics.impressions || 0,
        profileViews: metrics.profile_views || 0,
      };
    } catch (error: any) {
      console.error('[Instagram] Account insights failed:', error.response?.data || error.message);
      return {
        followerCount: 0,
        reach: 0,
        impressions: 0,
        profileViews: 0,
      };
    }
  }
}

export const instagramService = new InstagramService();
