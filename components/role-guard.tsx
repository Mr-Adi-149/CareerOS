'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { BrandLoader } from './brand-loader';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: ('candidate' | 'recruiter')[];
  fallback?: ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { user, hydrated, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) return router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    if (user?.role === 'candidate' && pathname.startsWith('/recruiter')) return router.replace('/');
    if (user?.role === 'recruiter' && (pathname.startsWith('/profile') || pathname.startsWith('/saved'))) return router.replace('/recruiter');
  }, [hydrated, isAuthenticated, pathname, router, user?.role]);

  if (!hydrated) return <div className="grid min-h-[50vh] place-items-center"><BrandLoader compact label="Checking access" /></div>;
  if (!user || !allowedRoles.includes(user.role)) return fallback ? <>{fallback}</> : null;
  return <>{children}</>;
}
