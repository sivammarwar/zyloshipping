import { MobileNav } from '@/components/layout/MobileNav';
import { BottomNav } from '@/components/layout/BottomNav';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MobileNav />
      {children}
      <BottomNav />
      {/* Spacer so content isn't hidden behind fixed bottom nav on mobile */}
      <div className="lg:hidden h-16" />
    </>
  );
}