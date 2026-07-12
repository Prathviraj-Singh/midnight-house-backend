'use client';

import { useAuth } from '@/context/AuthContext';
import { Calendar, ShoppingBag, UtensilsCrossed, Star } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const C = {
  bg: '#E1D4C2',
  s1: '#BEB5A9',
  s2: '#A78D78',
  s3: '#6E473B',
  accent: '#291C0E',
};

const cards = [
  { label: 'Bookings', desc: 'Review and approve theater booking requests', href: '/admin/bookings', icon: Calendar },
  { label: 'Orders', desc: 'Kitchen board — track and update order status', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Menu', desc: 'Add, edit, or remove menu items and photos', href: '/admin/menu', icon: UtensilsCrossed },
  { label: 'Reviews', desc: 'Moderate customer reviews', href: '/admin/reviews', icon: Star },
];

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: C.s3 }}>
          Welcome back
        </p>
        <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: C.accent }}>
          {user?.first_name} {user?.last_name}
        </h1>
        <p className="text-sm mb-10" style={{ color: C.s3 }}>
          Midnight House Control Panel
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Link href={card.href}
                className="flex items-start gap-4 p-6 rounded-2xl transition-all duration-300 group block"
                style={{ background: `${C.s1}30`, border: `1px solid ${C.s2}50` }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.accent)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = `${C.s2}50`)}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${C.accent}15` }}>
                  <Icon className="w-5 h-5" style={{ color: C.accent }} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1" style={{ color: C.accent }}>
                    {card.label}
                  </h3>
                  <p className="text-xs" style={{ color: C.s3 }}>{card.desc}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}