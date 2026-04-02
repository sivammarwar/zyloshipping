import { Router, Request, Response } from 'express';

const router = Router();

/**
 * ═══════════════════════════════════════════════════════════════
 * SOCIAL MEDIA OAUTH CONNECTIONS
 * ═══════════════════════════════════════════════════════════════
 * 
 * OAuth flow for connecting social media accounts:
 * 1. Frontend calls /connect/:platform
 * 2. Backend redirects to platform OAuth
 * 3. Platform redirects to /callback/:platform
 * 4. Backend exchanges code for token
 * 5. Account created/updated in database
 */

// ═══════════════════════════════════════════════════════════════
// INSTAGRAM OAUTH (Facebook Graph API)
// ═══════════════════════════════════════════════════════════════

router.get('/connect/instagram', (req: Request, res: Response) => {
  const redirectUri = `${process.env.BACKEND_URL}/api/admin/social-media/callback/instagram`;
  const scope = 'instagram_basic,instagram_content_publish,pages_read_engagement';
  
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${process.env.FACEBOOK_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=instagram` +
    `&response_type=code`;
  
  res.redirect(authUrl);
});

router.get('/callback/instagram', async (req: Request, res: Response) => {
  try {
    const { code, error } = req.query;
    
    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/adminsiva/social/accounts?error=oauth_denied`);
    }
    
    // Exchange code for access token
    const axios = require('axios');
    const redirectUri = `${process.env.BACKEND_URL}/api/admin/social-media/callback/instagram`;
    
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: redirectUri,
        code,
      }
    });
    
    const { access_token } = tokenResponse.data;
    
    // Get user's pages and Instagram account
    const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: { access_token }
    });
    
    const page = pagesResponse.data.data[0];
    if (!page) {
      return res.redirect(`${process.env.FRONTEND_URL}/adminsiva/social/accounts?error=no_page`);
    }
    
    // Get Instagram account from page
    const igResponse = await axios.get(`https://graph.facebook.com/v18.0/${page.id}`, {
      params: {
        fields: 'instagram_business_account{name,username,profile_picture_url}',
        access_token: page.access_token
      }
    });
    
    const igAccount = igResponse.data.instagram_business_account;
    if (!igAccount) {
      return res.redirect(`${process.env.FRONTEND_URL}/adminsiva/social/accounts?error=no_instagram`);
    }
    
    // Save to database
    const { prisma } = require('../../db/prisma');
    await prisma.socialMediaAccount.upsert({
      where: {
        platform_accountHandle: {
          platform: 'INSTAGRAM',
          accountHandle: igAccount.username
        }
      },
      create: {
        platform: 'INSTAGRAM',
        accountName: igAccount.name,
        accountHandle: igAccount.username,
        accountId: igAccount.id,
        accessToken: access_token,
        refreshToken: page.access_token,
        isActive: true,
        targetRegion: 'US',
        postsPerDay: 3,
      },
      update: {
        accountName: igAccount.name,
        accessToken: access_token,
        refreshToken: page.access_token,
        isActive: true,
      }
    });
    
    res.redirect(`${process.env.FRONTEND_URL}/adminsiva/social/accounts?success=instagram_connected`);
    
  } catch (err) {
    console.error('[Instagram OAuth Error]:', err);
    res.redirect(`${process.env.FRONTEND_URL}/adminsiva/social/accounts?error=instagram_failed`);
  }
});

// ═══════════════════════════════════════════════════════════════
// FACEBOOK OAUTH
// ═══════════════════════════════════════════════════════════════

router.get('/connect/facebook', (req: Request, res: Response) => {
  const redirectUri = `${process.env.BACKEND_URL}/api/admin/social-media/callback/facebook`;
  const scope = 'pages_manage_posts,pages_read_engagement,pages_show_list';
  
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${process.env.FACEBOOK_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=facebook` +
    `&response_type=code`;
  
  res.redirect(authUrl);
});

router.get('/callback/facebook', async (req: Request, res: Response) => {
  try {
    const { code, error } = req.query;
    
    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/adminsiva/social/accounts?error=oauth_denied`);
    }
    
    const axios = require('axios');
    const redirectUri = `${process.env.BACKEND_URL}/api/admin/social-media/callback/facebook`;
    
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: redirectUri,
        code,
      }
    });
    
    const { access_token } = tokenResponse.data;
    
    // Get user's pages
    const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: { access_token }
    });
    
    const page = pagesResponse.data.data[0];
    if (!page) {
      return res.redirect(`${process.env.FRONTEND_URL}/adminsiva/social/accounts?error=no_page`);
    }
    
    // Save to database
    const { prisma } = require('../../db/prisma');
    await prisma.socialMediaAccount.upsert({
      where: {
        platform_accountHandle: {
          platform: 'FACEBOOK',
          accountHandle: page.name
        }
      },
      create: {
        platform: 'FACEBOOK',
        accountName: page.name,
        accountHandle: page.name.replace(/\s+/g, '_').toLowerCase(),
        accountId: page.id,
        accessToken: page.access_token,
        refreshToken: access_token,
        isActive: true,
        targetRegion: 'US',
        postsPerDay: 3,
      },
      update: {
        accessToken: page.access_token,
        refreshToken: access_token,
        isActive: true,
      }
    });
    
    res.redirect(`${process.env.FRONTEND_URL}/adminsiva/social/accounts?success=facebook_connected`);
    
  } catch (err) {
    console.error('[Facebook OAuth Error]:', err);
    res.redirect(`${process.env.FRONTEND_URL}/adminsiva/social/accounts?error=facebook_failed`);
  }
});

// ═══════════════════════════════════════════════════════════════
// TWITTER OAUTH 2.0
// ═══════════════════════════════════════════════════════════════

router.get('/connect/twitter', async (req: Request, res: Response) => {
  try {
    const axios = require('axios');
    
    // Step 1: Get OAuth 2.0 authorization code
    const redirectUri = `${process.env.BACKEND_URL}/api/admin/social-media/callback/twitter`;
    const scope = 'tweet.read tweet.write users.read offline.access';
    
    // Generate PKCE verifier
    const crypto = require('crypto');
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    
    // Store code verifier in session or temporary storage
    // For now, we'll use a simple state parameter
    const state = Buffer.from(codeVerifier).toString('base64url');
    
    const authUrl = `https://twitter.com/i/oauth2/authorize?` +
      `response_type=code` +
      `&client_id=${process.env.TWITTER_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${state}` +
      `&code_challenge=${codeChallenge}` +
      `&code_challenge_method=S256`;
    
    res.redirect(authUrl);
    
  } catch (err) {
    console.error('[Twitter OAuth Init Error]:', err);
    res.redirect(`${process.env.FRONTEND_URL}/adminsiva/social/accounts?error=twitter_init_failed`);
  }
});

router.get('/callback/twitter', async (req: Request, res: Response) => {
  try {
    const { code, error, state } = req.query;
    
    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/adminsiva/social/accounts?error=oauth_denied`);
    }
    
    const axios = require('axios');
    const crypto = require('crypto');
    
    // Decode code verifier from state
    const codeVerifier = Buffer.from(state as string, 'base64url').toString();
    const redirectUri = `${process.env.BACKEND_URL}/api/admin/social-media/callback/twitter`;
    
    // Exchange code for token
    const tokenResponse = await axios.post('https://api.twitter.com/2/oauth2/token', {
      code,
      grant_type: 'authorization_code',
      client_id: process.env.TWITTER_CLIENT_ID,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const { access_token, refresh_token } = tokenResponse.data;
    
    // Get user info
    const userResponse = await axios.get('https://api.twitter.com/2/users/me', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    
    const user = userResponse.data.data;
    
    // Save to database
    const { prisma } = require('../../db/prisma');
    await prisma.socialMediaAccount.upsert({
      where: {
        platform_accountHandle: {
          platform: 'TWITTER',
          accountHandle: user.username
        }
      },
      create: {
        platform: 'TWITTER',
        accountName: user.name,
        accountHandle: user.username,
        accountId: user.id,
        accessToken: access_token,
        refreshToken: refresh_token,
        isActive: true,
        targetRegion: 'US',
        postsPerDay: 3,
      },
      update: {
        accountName: user.name,
        accessToken: access_token,
        refreshToken: refresh_token,
        isActive: true,
      }
    });
    
    res.redirect(`${process.env.FRONTEND_URL}/adminsiva/social/accounts?success=twitter_connected`);
    
  } catch (err) {
    console.error('[Twitter OAuth Error]:', err?.response?.data || err);
    res.redirect(`${process.env.FRONTEND_URL}/adminsiva/social/accounts?error=twitter_failed`);
  }
});

// ═══════════════════════════════════════════════════════════════
// MANUAL ACCOUNT CONNECTION (for API keys/tokens)
// ═══════════════════════════════════════════════════════════════

router.post('/connect/manual', async (req: Request, res: Response) => {
  try {
    const { platform, accountHandle, accountName, accessToken, refreshToken } = req.body;
    
    const { prisma } = require('../../db/prisma');
    
    const account = await prisma.socialMediaAccount.upsert({
      where: {
        platform_accountHandle: {
          platform,
          accountHandle
        }
      },
      create: {
        platform,
        accountName,
        accountHandle,
        accessToken,
        refreshToken,
        isActive: true,
        targetRegion: 'US',
        postsPerDay: 3,
      },
      update: {
        accountName,
        accessToken,
        refreshToken,
        isActive: true,
      }
    });
    
    res.json({ success: true, account });
    
  } catch (err) {
    console.error('[Manual Connect Error]:', err);
    res.status(500).json({ error: 'Failed to connect account' });
  }
});

export default router;
