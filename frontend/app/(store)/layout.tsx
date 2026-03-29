import { MobileNav } from '@/components/layout/MobileNav';
import { BottomNav } from '@/components/layout/BottomNav';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MobileNav />
      {children}
      <BottomNav />
    </>
  );
}
