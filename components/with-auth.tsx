'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCareer } from '@/lib/state';

type UserRole = 'candidate' | 'recruiter' | null;

interface WithAuthOptions {
    allowedRoles: UserRole[];
    redirectTo?: string;
    loadingComponent?: React.ReactNode;
}

export function withAuth<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    options: WithAuthOptions
) {
    return function WithAuthComponent(props: P) {
        const { userRole, hydrated, isTransitioning } = useCareer();
        const router = useRouter();
        const { allowedRoles, redirectTo = '/', loadingComponent } = options;

        useEffect(() => {
            if (hydrated && !isTransitioning) {
                if (!userRole) {
                    router.replace('/');
                } else if (!allowedRoles.includes(userRole)) {
                    router.replace(redirectTo);
                }
            }
        }, [hydrated, isTransitioning, userRole, allowedRoles, redirectTo, router]);

        // Show loading while checking auth
        if (!hydrated || isTransitioning) {
            return (
                loadingComponent || (
                    <div className="min-h-screen flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-200 border-t-green-800" />
                            <p className="text-sm font-medium text-stone-500">Verifying access...</p>
                        </div>
                    </div>
                )
            );
        }

        // Block access until auth check is complete
        if (hydrated && (!userRole || !allowedRoles.includes(userRole))) {
            return null;
        }

        return <WrappedComponent {...props} />;
    };
}