'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

function decodeTokenPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = typeof document !== 'undefined' ? document.cookie.match(/token=([^;]+)/)?.[1] || localStorage.getItem('token') : null;

    if (!token && !user) {
      router.replace(`/login?redirect=${pathname}`);
      return;
    }

    if (token) {
      const payload = decodeTokenPayload(token);
      const role = (payload?.role as string) || user?.role || 'customer';

      if (pathname.startsWith('/dashboard/loan-officer') && role !== 'loan_officer') {
        router.replace(role === 'underwriter' ? '/dashboard/underwriter' : '/dashboard');
      }
      if (pathname.startsWith('/dashboard/underwriter') && role !== 'underwriter') {
        router.replace(role === 'loan_officer' ? '/dashboard/loan-officer' : '/dashboard');
      }
    }
  }, [user, pathname, router]);

  return <>{children}</>;
}
