import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-playfair',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ZyloShipping — Fast Global Dropshipping',
  description:
    'AI-curated products from verified suppliers. Real-time tracking. Zero inventory headaches. Ship anywhere in the world.',
  keywords: ['dropshipping', 'ecommerce', 'global shipping', 'AI store'],
  openGraph: {
    title: 'ZyloShipping — Fast Global Dropshipping',
    description: 'Ship anything, anywhere. AI-powered dropshipping for the world.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-sans bg-off-white text-ink overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}