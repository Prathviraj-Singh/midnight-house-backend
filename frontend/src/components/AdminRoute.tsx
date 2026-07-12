'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface AdminRouteProps {
  children: ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!isLoading && (!user || !user.is_staff) && !isLoginPage) {
      router.replace('/admin/login');
    }
  }, [isLoading, user, router, isLoginPage]);

  // Login page — seedha render karo, koi check nahi
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Protected pages — user load hone ka wait karo
  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: '#E1D4C2' }} />
    );
  }

  if (!user || !user.is_staff) {
    return null;
  }

  return <>{children}</>;
}