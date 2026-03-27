import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: 'ae01.alicdn.com' },
      { protocol: 'https', hostname: '**.cjdropshipping.com' },
    ],
  },
  env: {
    NEXT_PUBLIC_RAZORPAY_KEY_ID:       process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    NEXT_PUBLIC_APP_URL:               process.env.NEXT_PUBLIC_APP_URL!,
  },
};

export default nextConfig;
