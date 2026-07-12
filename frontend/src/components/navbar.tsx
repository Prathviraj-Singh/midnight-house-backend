'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import NotificationBell from '@/components/NotificationBell';

const C = {
  bg: '#E1D4C2',
  s1: '#BEB5A9',
  s2: '#A78D78',
  s3: '#6E473B',
  accent: '#291C0E',
};

interface CartResponse {
  items: { quantity: number }[];
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

  const refreshCartCount = useCallback(async () => {
    if (!user) {
      setCartCount(0);
      return;
    }
    try {
      const res = await api.get<CartResponse>('/cart/');
      const total = res.data.items.reduce((sum, i) => sum + i.quantity, 0);
      setCartCount(total);
    } catch {
      setCartCount(0);
    }
  }, [user]);

  useEffect(() => {
    refreshCartCount();
    window.addEventListener('cart-updated', refreshCartCount);
    return () => window.removeEventListener('cart-updated', refreshCartCount);
  }, [refreshCartCount]);

  const navLinks = [
    { label: 'Menu', href: '/menu' },
    { label: 'Book Theater', href: '/book' },
    { label: 'Reviews', href: '/reviews' },
    ...(user ? [{ label: 'Dashboard', href: '/dashboard' }] : []),
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: `${C.bg}f0`,
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${C.s2}40`,
      }}
    >
      <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Midnight House" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <div className="text-sm font-bold tracking-[0.2em] uppercase" style={{ fontFamily: "'Playfair Display',serif", color: C.accent }}>Midnight House</div>
            <div className="text-[9px] tracking-[0.3em] uppercase" style={{ color: C.s3 }}>Your Own Private Space</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-[11px] tracking-[0.2em] uppercase" style={{ color: C.s3 }}>
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href}
              className="transition-colors duration-300"
              style={{ color: pathname === l.href ? C.accent : C.s3 }}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <NotificationBell />
          <Link href="/cart" className="relative p-2 rounded-full transition-all duration-300"
            style={{ background: `${C.s1}40`, color: C.accent }}>
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                style={{ background: C.accent, color: C.bg }}>
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <button onClick={logout}
              className="px-5 py-2 rounded-full text-[11px] tracking-[0.15em] uppercase transition-all duration-300"
              style={{ border: `1px solid ${C.s2}`, color: C.s3 }}>
              Sign Out
            </button>
          ) : (
            <Link href="/login"
              className="px-5 py-2 rounded-full text-[11px] tracking-[0.15em] uppercase font-semibold transition-all duration-300"
              style={{ background: C.accent, color: C.bg }}>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
}