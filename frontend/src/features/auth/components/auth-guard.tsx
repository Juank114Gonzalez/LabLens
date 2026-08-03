'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { routes } from '@/config/routes';
import {
  homeForRole,
  isPathAllowedForRole,
} from '@/features/auth/lib/roles';
import { useAuthStore } from '@/stores/auth.store';
import { Skeleton } from '@/components/ui/skeleton';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) return;

    if (!user) {
      router.replace(`${routes.login}?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!isPathAllowedForRole(pathname, user.role)) {
      router.replace(homeForRole(user.role));
    }
  }, [hydrated, pathname, router, user]);

  if (!hydrated) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isPathAllowedForRole(pathname, user.role)) {
    return null;
  }

  return <>{children}</>;
}
