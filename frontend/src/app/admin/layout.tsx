'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminRoute from '@/components/AdminRoute';
import {
  Calendar, ShoppingBag, UtensilsCrossed,
  Tag, Star,Users, LogOut, Menu, LayoutDashboard,
} from 'lucide-react';

const C = {
  bg: '#E1D4C2',
  s1: '#BEB5A9',
  s2: '#A78D78',
  s3: '#6E473B',
  accent: '#291C0E',
};

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Bookings', href: '/admin/bookings', icon: Calendar },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Menu', href: '/admin/menu', icon: UtensilsCrossed },
  { label: 'Offers', href: '/admin/offers', icon: Tag },
  { label: 'Reviews', href: '/admin/reviews', icon: Star },
  { label: 'Staff', href: '/admin/staff', icon: Users },
];

function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 md:hidden" style={{ background: 'rgba(0,0,0,0.3)' }}
          onClick={onClose} />
      )}
      <aside className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-64`}
        style={{ background: C.accent, borderRight: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Midnight House" className="w-9 h-9 rounded-full object-cover" />
            <div>
              <div className="text-xs font-bold tracking-widest uppercase" style={{ color: C.bg }}>
                Midnight House
              </div>
              <div className="text-[9px] tracking-wider uppercase" style={{ color: `${C.bg}60` }}>
                Admin Panel
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: isActive ? `${C.bg}15` : 'transparent',
                  color: isActive ? C.bg : `${C.bg}70`,
                }}>
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="text-xs mb-3 px-2" style={{ color: `${C.bg}50` }}>{user?.email}</div>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
            style={{ color: `${C.bg}70` }}>
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:ml-64 min-h-screen flex flex-col">
        <div className="md:hidden flex items-center justify-between px-6 h-16 sticky top-0 z-20"
          style={{ background: C.bg, borderBottom: `1px solid ${C.s2}40` }}>
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" style={{ color: C.accent }} />
          </button>
          <span className="text-sm font-bold tracking-widest uppercase"
            style={{ fontFamily: "'Playfair Display', serif", color: C.accent }}>Admin</span>
          <div />
        </div>
        <main className="flex-1 p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  // Login page — koi layout nahi, seedha render
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Protected pages — AdminRoute + sidebar layout
  return (
    <AdminRoute>
      <AdminPanelLayout>
        {children}
      </AdminPanelLayout>
    </AdminRoute>
  );
}