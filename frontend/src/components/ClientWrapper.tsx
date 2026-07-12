'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/navbar';
import { usePathname } from 'next/navigation';

export default function ClientWrapper({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth();
  const pathname = usePathname();

  const isAdminPage = pathname?.startsWith('/admin');

  // Admin pages — koi spinner nahi, seedha render karo
  if (isAdminPage) {
    return <>{children}</>;
  }

  // Normal pages — loading ke waqt spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#E1D4C2' }}>
        <div className="w-10 h-10 rounded-full animate-spin"
          style={{ border: '2px solid rgba(41,28,14,0.1)', borderTopColor: '#291C0E' }} />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}