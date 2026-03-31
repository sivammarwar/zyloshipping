import { MobileNav } from '@/components/layout/MobileNav';
import { BottomNav } from '@/components/layout/BottomNav';
import { CompareProvider } from '@/context/CompareContext';
import CompareBar from '@/components/store/CompareBar';
import CompareModal from '@/components/store/CompareModal';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CompareProvider>
      <MobileNav />
      {children}
      <CompareBar />
      <CompareModal />
      <BottomNav />
      {/* Spacer so content isn't hidden behind fixed bottom nav on mobile */}
      <div className="lg:hidden h-16" />
    </CompareProvider>
  );
}