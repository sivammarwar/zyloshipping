import type { Metadata } from 'next';
import './globals.css' // adjust path if using styles/

export const metadata: Metadata = {
  title:       'ZyloShipping — Fast Dropshipping',
  description: 'India\'s AI-powered dropshipping store',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
