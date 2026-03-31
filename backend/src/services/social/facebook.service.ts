import axios from 'axios';

interface FacebookCredentials {
  accessToken: string;
  pageId: string;
}

interface FacebookPostResponse {
  id: string;
  permalink_url: string;
}

/**
 * Facebook Graph API integration for automated posting
 * Supports: Posts, Videos, Photos
 */
export class FacebookService {
  private baseUrl = 'https://graph.facebook.com/v18.0';

  /**
   * Publish a Facebook post (text + image)
   */
  async publishPost(
    credentials: FacebookCredentials,
    message: string,
    imageUrl?: string,
    hashtags: string[] = []
  ): Promise<{ postId: string; permalink: string }> {
    try {
      const fullMessage = `${message}\n\n${hashtags.map(tag => `#${tag}`).join(' ')}`;

      let response;

      if (imageUrl) {
        // Post with photo
        response = await axios.post(
          `${this.baseUrl}/${credentials.pageId}/photos`,
          {
            url: imageUrl,
            caption: fullMessage,
            access_token: credentials.accessToken,
          }
        );
      } else {
        // Text-only post
        response = await axios.post(
          `${this.baseUrl}/${credentials.pageId}/feed`,
          {
            message: fullMessage,
            access_token: credentials.accessToken,
          }
        );
      }

      const postId = response.data.id || response.data.post_id;

      // Get permalink
      const postData = await axios.get(
        `${this.baseUrl}/${postId}`,
        {
          params: {
            fields: 'permalink_url',
            access_token: credentials.accessToken,
          },
        }
      );

      return {
        postId,
        permalink: postData.data.permalink_url,
      };
    } catch (error: any) {
      console.error('[Facebook] Post failed:', error.response?.data || error.message);
      throw new Error(`Facebook post failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Publish a Facebook video
   */
  async publishVideo(
    credentials: FacebookCredentials,
    videoUrl: string,
    description: string,
    hashtags: string[] = []
  ): Promise<{ postId: string; permalink: string }> {
    try {
      const fullDescription = `${description}\n\n${hashtags.map(tag => `#${tag}`).join(' ')}`;

      // Step 1: Initialize video upload
      const initResponse = await axios.post(
        `${this.baseUrl}/${credentials.pageId}/videos`,
        {
          upload_phase: 'start',
          file_url: videoUrl,
          description: fullDescription,
          access_token: credentials.accessToken,
        }
      );

      const videoId = initResponse.data.video_id;

      // Step 2: Wait for processing
      await this.waitForVideoProcessing(credentials, videoId);

      // Step 3: Get permalink
      const videoData = await axios.get(
        `${this.baseUrl}/${videoId}`,
        {
          params: {
            fields: 'permalink_url',
            access_token: credentials.accessToken,
          },
        }
      );

      return {
        postId: videoId,
        permalink: videoData.data.permalink_url,
      };
    } catch (error: any) {
      console.error('[Facebook] Video failed:', error.response?.data || error.message);
      throw new Error(`Facebook video failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Wait for video processing
   */
  private async waitForVideoProcessing(
    credentials: FacebookCredentials,
    videoId: string,
    maxAttempts: number = 20
  ): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const statusResponse = await axios.get(
        `${this.baseUrl}/${videoId}`,
        {
          params: {
            fields: 'status',
            access_token: credentials.accessToken,
          },
        }
      );

      const status = statusResponse.data.status?.video_status;

      if (status === 'ready') {
        return;
      } else if (status === 'error') {
        throw new Error('Video processing failed');
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    throw new Error('Video processing timeout');
  }

  /**
   * Get post insights/analytics
   */
  async getPostInsights(
    credentials: FacebookCredentials,
    postId: string
  ): Promise<{
    likes: number;
    comments: number;
    shares: number;
    reach: number;
    impressions: number;
    engagement: number;
  }> {
    try {
      // Get post engagement
      const postResponse = await axios.get(
        `${this.baseUrl}/${postId}`,
        {
          params: {
            fields: 'likes.summary(true),comments.summary(true),shares',
            access_token: credentials.accessToken,
          },
        }
      );

      const likes = postResponse.data.likes?.summary?.total_count || 0;
      const comments = postResponse.data.comments?.summary?.total_count || 0;
      const shares = postResponse.data.shares?.count || 0;

      // Get post insights (reach, impressions)
      let reach = 0;
      let impressions = 0;

      try {
        const insightsResponse = await axios.get(
          `${this.baseUrl}/${postId}/insights`,
          {
            params: {
              metric: 'post_impressions,post_impressions_unique',
              access_token: credentials.accessToken,
            },
          }
        );

        const metrics = insightsResponse.data.data.reduce((acc: any, item: any) => {
          acc[item.name] = item.values[0]?.value || 0;
          return acc;
        }, {});

        impressions = metrics.post_impressions || 0;
        reach = metrics.post_impressions_unique || 0;
      } catch (e) {
        // Insights might not be available for all posts
      }

      const engagement = likes + comments + shares;

      return {
        likes,
        comments,
        shares,
        reach,
        impressions,
        engagement,
      };
    } catch (error: any) {
      console.error('[Facebook] Insights failed:', error.response?.data || error.message);
      return {
        likes: 0,
        comments: 0,
        shares: 0,
        reach: 0,
        impressions: 0,
        engagement: 0,
      };
    }
  }

  /**
   * Get page insights
   */
  async getPageInsights(
    credentials: FacebookCredentials,
    period: 'day' | 'week' | 'days_28' = 'day'
  ): Promise<{
    followers: number;
    reach: number;
    impressions: number;
    engagement: number;
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${credentials.pageId}/insights`,
        {
          params: {
            metric: 'page_fans,page_impressions,page_impressions_unique,page_engaged_users',
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
        followers: metrics.page_fans || 0,
        reach: metrics.page_impressions_unique || 0,
        impressions: metrics.page_impressions || 0,
        engagement: metrics.page_engaged_users || 0,
      };
    } catch (error: any) {
      console.error('[Facebook] Page insights failed:', error.response?.data || error.message);
      return {
        followers: 0,
        reach: 0,
        impressions: 0,
        engagement: 0,
      };
    }
  }

  /**
   * Refresh long-lived access token
   */
  async refreshAccessToken(shortLivedToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/oauth/access_token`,
        {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: process.env.FACEBOOK_APP_ID,
            client_secret: process.env.FACEBOOK_APP_SECRET,
            fb_exchange_token: shortLivedToken,
          },
        }
      );

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error: any) {
      console.error('[Facebook] Token refresh failed:', error.response?.data || error.message);
      throw new Error('Failed to refresh Facebook access token');
    }
  }

  /**
   * Get page access token from user access token
   */
  async getPageAccessToken(userAccessToken: string, pageId: string): Promise<string> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${pageId}`,
        {
          params: {
            fields: 'access_token',
            access_token: userAccessToken,
          },
        }
      );

      return response.data.access_token;
    } catch (error: any) {
      console.error('[Facebook] Get page token failed:', error.response?.data || error.message);
      throw new Error('Failed to get Facebook page access token');
    }
  }
}

export const facebookService = new FacebookService();
