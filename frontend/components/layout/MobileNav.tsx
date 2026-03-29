'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getUserFromToken } from '@/lib/tokenManager';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const user = getUserFromToken();

  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/products', label: 'Products', icon: '🛍️' },
    { href: '/cart', label: 'Cart', icon: '🛒' },
    { href: '/orders', label: 'Orders', icon: '📦', authRequired: true },
    { href: '/support', label: 'Support', icon: '💬', authRequired: true },
  ];

  const filteredItems = navItems.filter(
    item => !item.authRequired || user
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-lg"
        aria-label="Toggle menu"
      >
        <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
          <span className={`block h-0.5 bg-gray-900 transition-transform ${
            isOpen ? 'rotate-45 translate-y-2' : ''
          }`} />
          <span className={`block h-0.5 bg-gray-900 transition-opacity ${
            isOpen ? 'opacity-0' : ''
          }`} />
          <span className={`block h-0.5 bg-gray-900 transition-transform ${
            isOpen ? '-rotate-45 -translate-y-2' : ''
          }`} />
        </div>
      </button>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`lg:hidden fixed top-0 right-0 bottom-0 w-64 bg-white z-40 transform transition-transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-6 pt-20">
          {user && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <p className="text-sm text-gray-600">Signed in as</p>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>
          )}

          <nav className="space-y-2">
            {filteredItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-red-50 text-red-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-6 pt-6 border-t border-gray-200">
            {user ? (
              <>
                {user.role === 'ADMIN' && (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg mb-2"
                  >
                    ⚙️ Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = '/login';
                  }}
                  className="w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg text-left"
                >
                  🚪 Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg mb-2"
                >
                  🔑 Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 bg-red-500 text-white hover:bg-red-600 rounded-lg text-center"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
