'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Header } from './header';
import { BrandLoader } from './brand-loader';

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hydrated } = useAuth();
  const pathname = usePathname();
  const isAuthRoute = pathname === '/login' || pathname === '/signup';

  if (!hydrated) {
    return <div className="flex min-h-screen items-center justify-center bg-ivory-100"><BrandLoader label="CareerOS workspace" /></div>;
  }

  if (isAuthRoute || !isAuthenticated) return <>{children}</>;

  return <><Header />{children}</>;
}
