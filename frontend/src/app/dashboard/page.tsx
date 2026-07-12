'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, AlertCircle, Calendar, Clock, Users, Film,
  Package, CreditCard, CheckCircle2, XCircle, Clock3, Gift,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

const C = {
  bg: '#E1D4C2',
  s1: '#BEB5A9',
  s2: '#A78D78',
  s3: '#6E473B',
  accent: '#291C0E',
};

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface Booking {
  id: string;
  movie_name: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  number_of_guests: number;
  total_amount: string;
  advance_amount: string;
  booking_status: string;
  created_at: string;
}

interface CelebrationBooking {
  id: string;
  package_type: string;
  occasion_name: string;
  event_date: string;
  number_of_guests: number;
  total_amount: string;
  advance_amount: string;
  booking_status: string;
  created_at: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  menu_item: string;
}
interface MenuItemLite {
  id: string;
  name: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  delivery_type: string;
  total_amount: string;
  items: OrderItem[];
  created_at: string;
}

interface RazorpayOrderResponse {
  payment_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  key: string;
}

type Tab = 'bookings' | 'celebrations' | 'orders';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; icon: React.ReactNode; label: string }> = {
    PENDING: { bg: `${C.s2}25`, color: C.s3, icon: <Clock3 className="w-3 h-3" />, label: 'Pending Approval' },
    APPROVED: { bg: `${C.accent}15`, color: C.accent, icon: <CheckCircle2 className="w-3 h-3" />, label: 'Approved — Pay Now' },
    REJECTED: { bg: '#7a221f15', color: '#7a221f', icon: <XCircle className="w-3 h-3" />, label: 'Rejected' },
    CONFIRMED: { bg: '#2d5a2d15', color: '#2d5a2d', icon: <CheckCircle2 className="w-3 h-3" />, label: 'Confirmed' },
  };
  const s = map[status] || map.PENDING;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase"
      style={{ background: s.bg, color: s.color }}>
      {s.icon} {s.label}
    </span>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [celebrations, setCelebrations] = useState<CelebrationBooking[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemLite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [payingId, setPayingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [bookingsRes, celebrationsRes, ordersRes, menuRes] = await Promise.all([
        api.get<Booking[]>('/bookings/'),
        api.get<CelebrationBooking[]>('/bookings/celebrations/'),
        api.get<Order[]>('/orders/'),
        api.get<MenuItemLite[]>('/catalog/menu-items/'),
      ]);
      setBookings(bookingsRes.data);
      setCelebrations(celebrationsRes.data);
      setOrders(ordersRes.data);
      setMenuItems(menuRes.data);
    } catch {
      setError('Could not load your dashboard right now.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePayAdvance = async (booking: Booking) => {
    setPayingId(booking.id);
    try {
      const rzpRes = await api.post<RazorpayOrderResponse>('/payments/create-order/', {
        payment_for: 'BOOKING',
        payment_type: 'ADVANCE',
        payment_method: 'UPI',
        amount: booking.advance_amount,
        booking: booking.id,
      });
      const rzpData = rzpRes.data;

      const options = {
        key: rzpData.key,
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: 'Midnight House',
        description: `Theater Booking — ${booking.movie_name}`,
        order_id: rzpData.razorpay_order_id,
        theme: { color: C.accent },
        prefill: {
          name: user ? `${user.first_name} ${user.last_name}` : '',
          email: user?.email || '',
          contact: user?.phone_number || '',
        },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await api.post('/payments/verify/', {
              payment_id: rzpData.payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            fetchData();
          } catch {
            setError('Payment verification failed. Please contact support if money was deducted.');
          } finally {
            setPayingId(null);
          }
        },
        modal: { ondismiss: () => setPayingId(null) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setError('Could not start payment. Please try again.');
      setPayingId(null);
    }
  };
  const handlePayCelebrationAdvance = async (celebration: CelebrationBooking) => {
    setPayingId(celebration.id);
    try {
      const rzpRes = await api.post<RazorpayOrderResponse>('/payments/create-order/', {
        payment_for: 'CELEBRATION',
        payment_type: 'ADVANCE',
        payment_method: 'UPI',
        amount: celebration.advance_amount,
        celebration_booking: celebration.id,
      });
      const rzpData = rzpRes.data;

      const options = {
        key: rzpData.key,
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: 'Midnight House',
        description: `Celebration — ${celebration.occasion_name}`,
        order_id: rzpData.razorpay_order_id,
        theme: { color: C.accent },
        prefill: {
          name: user ? `${user.first_name} ${user.last_name}` : '',
          email: user?.email || '',
          contact: user?.phone_number || '',
        },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await api.post('/payments/verify/', {
              payment_id: rzpData.payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            fetchData();
          } catch {
            setError('Payment verification failed. Please contact support if money was deducted.');
          } finally {
            setPayingId(null);
          }
        },
        modal: { ondismiss: () => setPayingId(null) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setError('Could not start payment. Please try again.');
      setPayingId(null);
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.accent }}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <header className="pt-32 pb-10 px-8 md:px-20 text-center">
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-[10px] tracking-[0.35em] uppercase mb-4" style={{ color: C.accent }}>
          Welcome Back{user ? `, ${user.first_name}` : ''}
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="font-bold" style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
          Your Dashboard
        </motion.h1>
      </header>

      <div className="flex items-center justify-center gap-3 mb-12 px-8 flex-wrap">
        <button onClick={() => setTab('bookings')}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-medium tracking-wide uppercase transition-all duration-300"
          style={{ background: tab === 'bookings' ? C.accent : `${C.s1}30`, color: tab === 'bookings' ? C.bg : C.s3, border: `1px solid ${tab === 'bookings' ? C.accent : C.s2}` }}>
          <Film className="w-3.5 h-3.5" /> Theater
        </button>
        <button onClick={() => setTab('celebrations')}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-medium tracking-wide uppercase transition-all duration-300"
          style={{ background: tab === 'celebrations' ? C.accent : `${C.s1}30`, color: tab === 'celebrations' ? C.bg : C.s3, border: `1px solid ${tab === 'celebrations' ? C.accent : C.s2}` }}>
          <Gift className="w-3.5 h-3.5" /> Celebrations
        </button>
        <button onClick={() => setTab('orders')}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-medium tracking-wide uppercase transition-all duration-300"
          style={{ background: tab === 'orders' ? C.accent : `${C.s1}30`, color: tab === 'orders' ? C.bg : C.s3, border: `1px solid ${tab === 'orders' ? C.accent : C.s2}` }}>
          <Package className="w-3.5 h-3.5" /> Orders
        </button>
      </div>

      <div className="px-8 md:px-20 pb-32">
        <div className="max-w-2xl mx-auto">

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.accent }} />
            </div>
          )}

          {!isLoading && error && (
            <div className="flex items-center gap-2 p-4 rounded-xl text-sm mb-6" style={{ background: '#7a221f15', color: '#7a221f' }}>
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {!isLoading && (
            <AnimatePresence mode="wait">

              {tab === 'bookings' && (
                <motion.div key="bookings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {bookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                      <Calendar className="w-10 h-10" style={{ color: C.s2 }} />
                      <p className="text-sm" style={{ color: C.s3 }}>No bookings yet.</p>
                      <Link href="/book" className="px-6 py-2.5 rounded-full text-xs font-semibold" style={{ background: C.accent, color: C.bg }}>
                        Book the Theater
                      </Link>
                    </div>
                  ) : (
                    bookings.map((b) => (
                      <motion.div key={b.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl p-5" style={{ background: `${C.s1}25`, border: `1px solid ${C.s2}50` }}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: C.accent, fontFamily: "'Playfair Display', serif" }}>
                              <Film className="w-3.5 h-3.5" /> {b.movie_name}
                            </h3>
                            <div className="flex items-center gap-3 text-xs mt-1.5" style={{ color: C.s3 }}>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(b.booking_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                              </span>
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {b.number_of_guests}</span>
                            </div>
                          </div>
                          <StatusBadge status={b.booking_status} />
                        </div>
                        <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${C.s2}40` }}>
                          <div className="text-xs" style={{ color: C.s3 }}>
                            Total: <strong style={{ color: C.accent }}>₹{parseFloat(b.total_amount).toFixed(0)}</strong>
                            {' · '}Advance: <strong style={{ color: C.accent }}>₹{parseFloat(b.advance_amount).toFixed(0)}</strong>
                          </div>
                          {b.booking_status === 'APPROVED' && (
                            <button onClick={() => handlePayAdvance(b)} disabled={payingId === b.id}
                              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 disabled:opacity-60"
                              style={{ background: C.accent, color: C.bg }}>
                              {payingId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                              Pay ₹{parseFloat(b.advance_amount).toFixed(0)}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}

              {tab === 'celebrations' && (
                <motion.div key="celebrations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {celebrations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                      <Gift className="w-10 h-10" style={{ color: C.s2 }} />
                      <p className="text-sm" style={{ color: C.s3 }}>No celebration bookings yet.</p>
                      <Link href="/book-celebration" className="px-6 py-2.5 rounded-full text-xs font-semibold" style={{ background: C.accent, color: C.bg }}>
                        Book a Celebration
                      </Link>
                    </div>
                  ) : (
                    celebrations.map((c) => (
                      <motion.div key={c.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl p-5" style={{ background: `${C.s1}25`, border: `1px solid ${C.s2}50` }}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: C.accent, fontFamily: "'Playfair Display', serif" }}>
                              <Gift className="w-3.5 h-3.5" /> {c.occasion_name} — {c.package_type}
                            </h3>
                            <div className="flex items-center gap-3 text-xs mt-1.5" style={{ color: C.s3 }}>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(c.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c.number_of_guests}</span>
                            </div>
                          </div>
                          <StatusBadge status={c.booking_status} />
                        </div>
                        <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${C.s2}40` }}>
                          <div className="text-xs" style={{ color: C.s3 }}>
                            Total: <strong style={{ color: C.accent }}>₹{parseFloat(c.total_amount).toFixed(0)}</strong>
                            {' · '}Advance: <strong style={{ color: C.accent }}>₹{parseFloat(c.advance_amount).toFixed(0)}</strong>
                          </div>
                          {c.booking_status === 'APPROVED' && (
                            <button onClick={() => handlePayCelebrationAdvance(c)} disabled={payingId === c.id}
                              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 disabled:opacity-60"
                              style={{ background: C.accent, color: C.bg }}>
                              {payingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                              Pay ₹{parseFloat(c.advance_amount).toFixed(0)}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}

              {tab === 'orders' && (
                <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                      <Package className="w-10 h-10" style={{ color: C.s2 }} />
                      <p className="text-sm" style={{ color: C.s3 }}>No orders yet.</p>
                      <Link href="/menu" className="px-6 py-2.5 rounded-full text-xs font-semibold" style={{ background: C.accent, color: C.bg }}>
                        Browse Menu
                      </Link>
                    </div>
                  ) : (
                    orders.map((o) => (
                      <motion.div key={o.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl p-5" style={{ background: `${C.s1}25`, border: `1px solid ${C.s2}50` }}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm mb-1" style={{ color: C.accent, fontFamily: "'Playfair Display', serif" }}>
                              {o.items.map((item) => {
                                const name = menuItems.find((m) => m.id === item.menu_item)?.name || 'Item';
                                return `${name} ×${item.quantity}`;
                              }).join(', ')}
                            </h3>
                            <div className="flex items-center gap-3 text-xs mt-1.5" style={{ color: C.s3 }}>
                              <span>#{o.order_number}</span>
                              <span>·</span>
                              <span>{o.delivery_type === 'DINE_IN' ? 'Dine In' : 'Delivery'}</span>
                              <span>·</span>
                              <span>{new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                            </div>
                          </div>
                          <StatusBadge status={o.status} />
                        </div>
                        <div className="pt-3" style={{ borderTop: `1px solid ${C.s2}40` }}>
                          <span className="text-xs" style={{ color: C.s3 }}>
                            Total: <strong style={{ color: C.accent }}>₹{parseFloat(o.total_amount).toFixed(0)}</strong>
                          </span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}