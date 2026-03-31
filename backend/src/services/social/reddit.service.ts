import axios from 'axios';

interface RedditCredentials {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  accessToken?: string;
}

interface RedditPostResponse {
  id: string;
  name: string;
  url: string;
  permalink: string;
}

/**
 * Reddit API integration for automated posting
 * Supports: Text posts, Link posts, Image posts
 * Best subreddits for dropshipping: r/deals, r/shutupandtakemymoney, r/BuyItForLife
 */
export class RedditService {
  private baseUrl = 'https://oauth.reddit.com';
  private authUrl = 'https://www.reddit.com/api/v1/access_token';

  /**
   * Get OAuth access token
   */
  async getAccessToken(credentials: RedditCredentials): Promise<string> {
    try {
      const auth = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64');

      const response = await axios.post(
        this.authUrl,
        new URLSearchParams({
          grant_type: 'password',
          username: credentials.username,
          password: credentials.password,
        }),
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'ZyloShipping/1.0',
          },
        }
      );

      return response.data.access_token;
    } catch (error: any) {
      console.error('[Reddit] Auth failed:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Reddit');
    }
  }

  /**
   * Submit a text post to a subreddit
   */
  async submitTextPost(
    credentials: RedditCredentials,
    subreddit: string,
    title: string,
    text: string,
    flairId?: string
  ): Promise<RedditPostResponse> {
    try {
      const accessToken = credentials.accessToken || await this.getAccessToken(credentials);

      const data: any = {
        sr: subreddit,
        kind: 'self',
        title: title.substring(0, 300), // Reddit title limit
        text,
        api_type: 'json',
      };

      if (flairId) {
        data.flair_id = flairId;
      }

      const response = await axios.post(
        `${this.baseUrl}/api/submit`,
        new URLSearchParams(data),
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'ZyloShipping/1.0',
          },
        }
      );

      if (response.data.json?.errors?.length > 0) {
        throw new Error(response.data.json.errors[0][1]);
      }

      const postData = response.data.json.data;
      return {
        id: postData.id,
        name: postData.name,
        url: postData.url,
        permalink: `https://reddit.com${postData.permalink}`,
      };
    } catch (error: any) {
      console.error('[Reddit] Text post failed:', error.response?.data || error.message);
      throw new Error(`Reddit post failed: ${error.message}`);
    }
  }

  /**
   * Submit a link post to a subreddit
   */
  async submitLinkPost(
    credentials: RedditCredentials,
    subreddit: string,
    title: string,
    url: string,
    flairId?: string
  ): Promise<RedditPostResponse> {
    try {
      const accessToken = credentials.accessToken || await this.getAccessToken(credentials);

      const data: any = {
        sr: subreddit,
        kind: 'link',
        title: title.substring(0, 300),
        url,
        api_type: 'json',
      };

      if (flairId) {
        data.flair_id = flairId;
      }

      const response = await axios.post(
        `${this.baseUrl}/api/submit`,
        new URLSearchParams(data),
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'ZyloShipping/1.0',
          },
        }
      );

      if (response.data.json?.errors?.length > 0) {
        throw new Error(response.data.json.errors[0][1]);
      }

      const postData = response.data.json.data;
      return {
        id: postData.id,
        name: postData.name,
        url: postData.url,
        permalink: `https://reddit.com${postData.permalink}`,
      };
    } catch (error: any) {
      console.error('[Reddit] Link post failed:', error.response?.data || error.message);
      throw new Error(`Reddit link post failed: ${error.message}`);
    }
  }

  /**
   * Submit an image post to a subreddit
   */
  async submitImagePost(
    credentials: RedditCredentials,
    subreddit: string,
    title: string,
    imageUrl: string,
    flairId?: string
  ): Promise<RedditPostResponse> {
    try {
      const accessToken = credentials.accessToken || await this.getAccessToken(credentials);

      // Upload image to Reddit
      const uploadedUrl = await this.uploadImage(accessToken, imageUrl);

      const data: any = {
        sr: subreddit,
        kind: 'image',
        title: title.substring(0, 300),
        url: uploadedUrl,
        api_type: 'json',
      };

      if (flairId) {
        data.flair_id = flairId;
      }

      const response = await axios.post(
        `${this.baseUrl}/api/submit`,
        new URLSearchParams(data),
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'ZyloShipping/1.0',
          },
        }
      );

      if (response.data.json?.errors?.length > 0) {
        throw new Error(response.data.json.errors[0][1]);
      }

      const postData = response.data.json.data;
      return {
        id: postData.id,
        name: postData.name,
        url: postData.url,
        permalink: `https://reddit.com${postData.permalink}`,
      };
    } catch (error: any) {
      console.error('[Reddit] Image post failed:', error.response?.data || error.message);
      throw new Error(`Reddit image post failed: ${error.message}`);
    }
  }

  /**
   * Upload image to Reddit
   */
  private async uploadImage(accessToken: string, imageUrl: string): Promise<string> {
    try {
      // Download image
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
      });

      const imageBuffer = Buffer.from(imageResponse.data);
      const mimeType = imageResponse.headers['content-type'] || 'image/jpeg';

      // Get upload lease
      const leaseResponse = await axios.post(
        `${this.baseUrl}/api/media/asset.json`,
        new URLSearchParams({
          filepath: 'image.jpg',
          mimetype: mimeType,
        }),
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'ZyloShipping/1.0',
          },
        }
      );

      const uploadUrl = leaseResponse.data.args.action;
      const uploadFields = leaseResponse.data.args.fields;

      // Upload to S3
      const formData = new FormData();
      Object.entries(uploadFields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append('file', new Blob([imageBuffer], { type: mimeType }));

      await axios.post(uploadUrl, formData);

      return leaseResponse.data.asset.asset_id;
    } catch (error) {
      console.error('[Reddit] Image upload failed:', error);
      throw new Error('Failed to upload image to Reddit');
    }
  }

  /**
   * Get post statistics
   */
  async getPostStats(
    credentials: RedditCredentials,
    postId: string
  ): Promise<{
    score: number;
    upvoteRatio: number;
    numComments: number;
    views: number;
  }> {
    try {
      const accessToken = credentials.accessToken || await this.getAccessToken(credentials);

      const response = await axios.get(
        `${this.baseUrl}/api/info`,
        {
          params: { id: `t3_${postId}` },
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'ZyloShipping/1.0',
          },
        }
      );

      const post = response.data.data.children[0]?.data;

      if (!post) {
        throw new Error('Post not found');
      }

      return {
        score: post.score || 0,
        upvoteRatio: post.upvote_ratio || 0,
        numComments: post.num_comments || 0,
        views: post.view_count || 0,
      };
    } catch (error: any) {
      console.error('[Reddit] Get stats failed:', error.response?.data || error.message);
      return {
        score: 0,
        upvoteRatio: 0,
        numComments: 0,
        views: 0,
      };
    }
  }

  /**
   * Get user karma
   */
  async getUserKarma(credentials: RedditCredentials): Promise<{
    linkKarma: number;
    commentKarma: number;
    totalKarma: number;
  }> {
    try {
      const accessToken = credentials.accessToken || await this.getAccessToken(credentials);

      const response = await axios.get(
        `${this.baseUrl}/api/v1/me`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'ZyloShipping/1.0',
          },
        }
      );

      const user = response.data;

      return {
        linkKarma: user.link_karma || 0,
        commentKarma: user.comment_karma || 0,
        totalKarma: (user.link_karma || 0) + (user.comment_karma || 0),
      };
    } catch (error: any) {
      console.error('[Reddit] Get karma failed:', error.response?.data || error.message);
      return {
        linkKarma: 0,
        commentKarma: 0,
        totalKarma: 0,
      };
    }
  }

  /**
   * Get subreddit flairs
   */
  async getSubredditFlairs(
    credentials: RedditCredentials,
    subreddit: string
  ): Promise<Array<{ id: string; text: string }>> {
    try {
      const accessToken = credentials.accessToken || await this.getAccessToken(credentials);

      const response = await axios.get(
        `${this.baseUrl}/r/${subreddit}/api/link_flair_v2`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'ZyloShipping/1.0',
          },
        }
      );

      return response.data.map((flair: any) => ({
        id: flair.id,
        text: flair.text,
      }));
    } catch (error) {
      console.error('[Reddit] Get flairs failed:', error);
      return [];
    }
  }

  /**
   * Delete a post
   */
  async deletePost(credentials: RedditCredentials, postName: string): Promise<boolean> {
    try {
      const accessToken = credentials.accessToken || await this.getAccessToken(credentials);

      await axios.post(
        `${this.baseUrl}/api/del`,
        new URLSearchParams({ id: postName }),
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'ZyloShipping/1.0',
          },
        }
      );

      return true;
    } catch (error: any) {
      console.error('[Reddit] Delete failed:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Get recommended subreddits for dropshipping/ecommerce
   */
  getRecommendedSubreddits(): Array<{ name: string; description: string; category: string }> {
    return [
      // Deals & Shopping
      { name: 'deals', description: 'Best deals and discounts', category: 'Shopping' },
      { name: 'shutupandtakemymoney', description: 'Cool products worth buying', category: 'Shopping' },
      { name: 'amazondeals', description: 'Amazon deals and discounts', category: 'Shopping' },
      { name: 'frugal', description: 'Frugal living and saving money', category: 'Shopping' },
      
      // Product Quality
      { name: 'BuyItForLife', description: 'Durable, quality products', category: 'Quality' },
      { name: 'ProductPorn', description: 'Beautiful product design', category: 'Quality' },
      
      // Lifestyle
      { name: 'malelivingspace', description: 'Home decor for men', category: 'Lifestyle' },
      { name: 'femalelivingspace', description: 'Home decor for women', category: 'Lifestyle' },
      { name: 'homeimprovement', description: 'Home improvement products', category: 'Lifestyle' },
      { name: 'gadgets', description: 'Cool gadgets and tech', category: 'Tech' },
      
      // Specific Categories
      { name: 'EDC', description: 'Everyday carry items', category: 'Accessories' },
      { name: 'camping', description: 'Camping and outdoor gear', category: 'Outdoor' },
      { name: 'fitness', description: 'Fitness equipment and gear', category: 'Health' },
      { name: 'cooking', description: 'Cooking tools and gadgets', category: 'Kitchen' },
    ];
  }
}

export const redditService = new RedditService();
