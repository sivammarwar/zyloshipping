import SellerGuard from '@/components/auth/SellerGuard';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <SellerGuard>{children}</SellerGuard>;
}