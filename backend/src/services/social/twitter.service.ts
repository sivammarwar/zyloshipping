import axios from 'axios';

interface TwitterCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
  bearerToken: string;
}

interface TwitterPostResponse {
  id: string;
  text: string;
}

/**
 * Twitter/X API v2 integration for automated posting
 * Supports: Tweets, Threads, Media uploads
 */
export class TwitterService {
  private baseUrl = 'https://api.twitter.com/2';
  private uploadUrl = 'https://upload.twitter.com/1.1';

  /**
   * Publish a tweet (text + optional media)
   */
  async publishTweet(
    credentials: TwitterCredentials,
    text: string,
    hashtags: string[] = [],
    mediaUrls?: string[]
  ): Promise<{ tweetId: string; url: string }> {
    try {
      // Add hashtags to text
      const fullText = `${text}\n\n${hashtags.map(tag => `#${tag}`).join(' ')}`;

      // Truncate to 280 characters if needed
      const tweetText = fullText.length > 280 ? fullText.substring(0, 277) + '...' : fullText;

      let mediaIds: string[] = [];

      // Upload media if provided
      if (mediaUrls && mediaUrls.length > 0) {
        mediaIds = await this.uploadMedia(credentials, mediaUrls);
      }

      // Create tweet
      const tweetData: any = {
        text: tweetText,
      };

      if (mediaIds.length > 0) {
        tweetData.media = {
          media_ids: mediaIds,
        };
      }

      const response = await axios.post(
        `${this.baseUrl}/tweets`,
        tweetData,
        {
          headers: {
            'Authorization': `Bearer ${credentials.bearerToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const tweetId = response.data.data.id;
      const username = await this.getUsername(credentials);
      const url = `https://twitter.com/${username}/status/${tweetId}`;

      return { tweetId, url };
    } catch (error: any) {
      console.error('[Twitter] Tweet failed:', error.response?.data || error.message);
      throw new Error(`Twitter tweet failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Publish a thread (multiple tweets)
   */
  async publishThread(
    credentials: TwitterCredentials,
    tweets: string[],
    hashtags: string[] = []
  ): Promise<{ threadId: string; url: string; tweetIds: string[] }> {
    try {
      const tweetIds: string[] = [];
      let previousTweetId: string | undefined;

      for (let i = 0; i < tweets.length; i++) {
        const isLast = i === tweets.length - 1;
        const text = isLast ? `${tweets[i]}\n\n${hashtags.map(tag => `#${tag}`).join(' ')}` : tweets[i];

        const tweetData: any = {
          text: text.length > 280 ? text.substring(0, 277) + '...' : text,
        };

        if (previousTweetId) {
          tweetData.reply = {
            in_reply_to_tweet_id: previousTweetId,
          };
        }

        const response = await axios.post(
          `${this.baseUrl}/tweets`,
          tweetData,
          {
            headers: {
              'Authorization': `Bearer ${credentials.bearerToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const tweetId = response.data.data.id;
        tweetIds.push(tweetId);
        previousTweetId = tweetId;

        // Wait 1 second between tweets to avoid rate limits
        if (i < tweets.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const username = await this.getUsername(credentials);
      const url = `https://twitter.com/${username}/status/${tweetIds[0]}`;

      return {
        threadId: tweetIds[0],
        url,
        tweetIds,
      };
    } catch (error: any) {
      console.error('[Twitter] Thread failed:', error.response?.data || error.message);
      throw new Error(`Twitter thread failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Upload media (images/videos)
   */
  private async uploadMedia(
    credentials: TwitterCredentials,
    mediaUrls: string[]
  ): Promise<string[]> {
    const mediaIds: string[] = [];

    for (const url of mediaUrls.slice(0, 4)) { // Max 4 images per tweet
      try {
        // Download media
        const mediaResponse = await axios.get(url, {
          responseType: 'arraybuffer',
        });

        const mediaBuffer = Buffer.from(mediaResponse.data);
        const mediaType = mediaResponse.headers['content-type'];

        // Upload to Twitter
        const uploadResponse = await axios.post(
          `${this.uploadUrl}/media/upload.json`,
          {
            media_data: mediaBuffer.toString('base64'),
            media_type: mediaType,
          },
          {
            headers: {
              'Authorization': this.getOAuth1Header(credentials, 'POST', `${this.uploadUrl}/media/upload.json`),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );

        mediaIds.push(uploadResponse.data.media_id_string);
      } catch (error) {
        console.error('[Twitter] Media upload failed:', error);
      }
    }

    return mediaIds;
  }

  /**
   * Get tweet analytics
   */
  async getTweetMetrics(
    credentials: TwitterCredentials,
    tweetId: string
  ): Promise<{
    likes: number;
    retweets: number;
    replies: number;
    impressions: number;
    engagement: number;
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/tweets/${tweetId}`,
        {
          params: {
            'tweet.fields': 'public_metrics',
          },
          headers: {
            'Authorization': `Bearer ${credentials.bearerToken}`,
          },
        }
      );

      const metrics = response.data.data.public_metrics;

      return {
        likes: metrics.like_count || 0,
        retweets: metrics.retweet_count || 0,
        replies: metrics.reply_count || 0,
        impressions: metrics.impression_count || 0,
        engagement: (metrics.like_count || 0) + (metrics.retweet_count || 0) + (metrics.reply_count || 0),
      };
    } catch (error: any) {
      console.error('[Twitter] Metrics failed:', error.response?.data || error.message);
      return {
        likes: 0,
        retweets: 0,
        replies: 0,
        impressions: 0,
        engagement: 0,
      };
    }
  }

  /**
   * Get user metrics
   */
  async getUserMetrics(
    credentials: TwitterCredentials
  ): Promise<{
    followers: number;
    following: number;
    tweets: number;
  }> {
    try {
      const username = await this.getUsername(credentials);

      const response = await axios.get(
        `${this.baseUrl}/users/by/username/${username}`,
        {
          params: {
            'user.fields': 'public_metrics',
          },
          headers: {
            'Authorization': `Bearer ${credentials.bearerToken}`,
          },
        }
      );

      const metrics = response.data.data.public_metrics;

      return {
        followers: metrics.followers_count || 0,
        following: metrics.following_count || 0,
        tweets: metrics.tweet_count || 0,
      };
    } catch (error: any) {
      console.error('[Twitter] User metrics failed:', error.response?.data || error.message);
      return {
        followers: 0,
        following: 0,
        tweets: 0,
      };
    }
  }

  /**
   * Get authenticated user's username
   */
  private async getUsername(credentials: TwitterCredentials): Promise<string> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/users/me`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.bearerToken}`,
          },
        }
      );

      return response.data.data.username;
    } catch (error) {
      return 'user';
    }
  }

  /**
   * Generate OAuth 1.0a header (for media upload)
   */
  private getOAuth1Header(credentials: TwitterCredentials, method: string, url: string): string {
    // Simplified OAuth 1.0a implementation
    // In production, use a library like 'oauth-1.0a'
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Math.random().toString(36).substring(2);

    return `OAuth oauth_consumer_key="${credentials.apiKey}", oauth_token="${credentials.accessToken}", oauth_signature_method="HMAC-SHA1", oauth_timestamp="${timestamp}", oauth_nonce="${nonce}", oauth_version="1.0"`;
  }

  /**
   * Delete a tweet
   */
  async deleteTweet(credentials: TwitterCredentials, tweetId: string): Promise<boolean> {
    try {
      await axios.delete(
        `${this.baseUrl}/tweets/${tweetId}`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.bearerToken}`,
          },
        }
      );

      return true;
    } catch (error: any) {
      console.error('[Twitter] Delete failed:', error.response?.data || error.message);
      return false;
    }
  }
}

export const twitterService = new TwitterService();
