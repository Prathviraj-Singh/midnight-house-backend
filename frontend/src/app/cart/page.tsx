'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Minus, Plus, Loader2, ShoppingBag, ArrowRight, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

const C = {
  bg: '#E1D4C2',
  s1: '#BEB5A9',
  s2: '#A78D78',
  s3: '#6E473B',
  accent: '#291C0E',
};

interface CartItem {
  id: string;
  menu_item: string;
  quantity: number;
  added_at: string;
  line_total: string;
}

interface CartResponse {
  id: string;
  items: CartItem[];
  subtotal: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
}

interface EnrichedCartItem extends CartItem {
  menuItemDetails: MenuItem | undefined;
}

function CartPageContent() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [cartRes, menuRes] = await Promise.all([
        api.get<CartResponse>('/cart/'),
        api.get<MenuItem[]>('/catalog/menu-items/'),
      ]);
      setCartItems(cartRes.data.items);
      setMenuItems(menuRes.data);
    } catch {
      setError('Could not load your cart right now.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const enrichedItems: EnrichedCartItem[] = useMemo(() => {
    return cartItems.map((item) => ({
      ...item,
      menuItemDetails: menuItems.find((m) => m.id === item.menu_item),
    }));
  }, [cartItems, menuItems]);

  const subtotal = useMemo(() => {
    return enrichedItems.reduce((sum, item) => sum + parseFloat(item.line_total), 0);
  }, [enrichedItems]);

  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const updateQuantity = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;

    // Optimistic update — no loading flicker
    const item = enrichedItems.find((i) => i.id === itemId);
    if (item?.menuItemDetails) {
      const newLineTotal = (parseFloat(item.menuItemDetails.price) * newQty).toFixed(2);
      setCartItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity: newQty, line_total: newLineTotal } : i))
      );
    }

    try {
      await api.patch(`/cart/items/${itemId}/`, { quantity: newQty });
      window.dispatchEvent(new Event('cart-updated'));
    } catch {
      setError('Could not update quantity. Please try again.');
      fetchData(); // revert to server state on failure
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdatingId(itemId);
    try {
      await api.delete(`/cart/items/${itemId}/`);
      setCartItems((prev) => prev.filter((i) => i.id !== itemId));
      window.dispatchEvent(new Event('cart-updated'));
    } catch {
      setError('Could not remove item. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.accent }}>
      <header className="pt-32 pb-10 px-8 md:px-20 text-center">
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-[10px] tracking-[0.35em] uppercase mb-4" style={{ color: C.accent }}>
          Your Order
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="font-bold" style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
          Your Cart
        </motion.h1>
      </header>

      <div className="px-8 md:px-20 pb-32">
        <div className="max-w-3xl mx-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.accent }} />
              <p className="text-sm" style={{ color: C.s3 }}>Loading your cart…</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="flex items-center gap-2 p-4 rounded-xl text-sm mb-6" style={{ background: '#7a221f15', color: '#7a221f' }}>
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {!isLoading && enrichedItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
              <ShoppingBag className="w-10 h-10" style={{ color: C.s2 }} />
              <p className="text-lg font-medium" style={{ color: C.accent, fontFamily: "'Playfair Display', serif" }}>
                Your cart is empty
              </p>
              <p className="text-sm mb-4" style={{ color: C.s3 }}>
                Browse the menu and add something delicious.
              </p>
              <Link href="/menu"
                className="px-8 py-3 rounded-full text-sm font-semibold"
                style={{ background: C.accent, color: C.bg }}>
                Explore Menu
              </Link>
            </div>
          )}

          {!isLoading && enrichedItems.length > 0 && (
            <>
              <div className="space-y-3 mb-8">
                <AnimatePresence mode="popLayout">
                  {enrichedItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-4 p-5 rounded-2xl"
                      style={{ background: `${C.s1}25`, border: `1px solid ${C.s2}50` }}
                    >
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `linear-gradient(135deg, ${C.s2}, ${C.s3})` }}>
                        <span className="text-[9px] tracking-wide uppercase opacity-50" style={{ color: C.bg }}>
                          {item.menuItemDetails?.name.split(' ')[0] || '—'}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate" style={{ color: C.accent, fontFamily: "'Playfair Display', serif" }}>
                          {item.menuItemDetails?.name || 'Item'}
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: C.s3 }}>
                          ₹{item.menuItemDetails ? parseFloat(item.menuItemDetails.price).toFixed(0) : '—'} each
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={updatingId === item.id || item.quantity <= 1}
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                          style={{ background: `${C.s1}50`, color: C.accent }}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-semibold w-5 text-center" style={{ color: C.accent }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={updatingId === item.id}
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                          style={{ background: `${C.s1}50`, color: C.accent }}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-sm font-bold w-16 text-right shrink-0" style={{ color: C.accent }}>
                        ₹{parseFloat(item.line_total).toFixed(0)}
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={updatingId === item.id}
                        className="p-2 rounded-full transition-all shrink-0"
                        style={{ color: '#7a221f' }}
                      >
                        {updatingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="rounded-2xl p-6 space-y-3" style={{ background: `${C.s1}30`, border: `1px solid ${C.s2}50` }}>
                <div className="flex justify-between text-sm" style={{ color: C.s3 }}>
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm" style={{ color: C.s3 }}>
                  <span>Tax (5%)</span>
                  <span>₹{tax.toFixed(0)}</span>
                </div>
                <div className="h-px" style={{ background: `${C.s2}50` }} />
                <div className="flex justify-between text-lg font-bold" style={{ color: C.accent, fontFamily: "'Playfair Display', serif" }}>
                  <span>Total</span>
                  <span>₹{total.toFixed(0)}</span>
                </div>

                <Link
                  href="/checkout"
                  className="group w-full flex items-center justify-center gap-3 px-8 py-4 rounded-full font-semibold text-sm mt-4 transition-all duration-300"
                  style={{ background: C.accent, color: C.bg }}
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <ProtectedRoute>
      <CartPageContent />
    </ProtectedRoute>
  );
}