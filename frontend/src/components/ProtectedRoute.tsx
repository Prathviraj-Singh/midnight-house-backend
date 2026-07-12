'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

const C = {
  bg: '#E1D4C2',
  accent: '#291C0E',
};

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Sirf redirect karo jab loading complete ho jaaye
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  // Loading ke waqt — spinner dikho, kuch bhi render mat karo
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: C.bg }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-10 h-10 rounded-full"
          style={{
            border: `2px solid ${C.accent}20`,
            borderTopColor: C.accent,
          }}
        />
      </div>
    );
  }

  // Session restore ke baad user nahi mila — null return karo (redirect fire ho raha hai useEffect se)
  if (!user) {
    return null;
  }

  // Authenticated — children render karo
  return <>{children}</>;
}