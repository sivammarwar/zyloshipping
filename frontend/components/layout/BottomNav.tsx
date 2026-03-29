'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getUserFromToken } from '@/lib/tokenManager';

export function BottomNav() {
  const pathname = usePathname();
  const user = getUserFromToken();

  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/products', label: 'Shop', icon: '🛍️' },
    { href: '/cart', label: 'Cart', icon: '🛒' },
    { href: user ? '/orders' : '/login', label: user ? 'Orders' : 'Login', icon: user ? '📦' : '🔑' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-red-600' : 'text-gray-600'
              }`}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
