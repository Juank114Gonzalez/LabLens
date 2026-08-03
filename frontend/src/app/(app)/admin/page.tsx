'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '@/config/routes';

export default function AdminIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(routes.adminUsers);
  }, [router]);
  return null;
}
