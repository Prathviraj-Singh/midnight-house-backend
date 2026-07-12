'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, RefreshCw, ShoppingBag, ArrowRight } from 'lucide-react';
import api from '@/lib/api';

const C = {
  bg: '#E1D4C2',
  s1: '#BEB5A9',
  s2: '#A78D78',
  s3: '#6E473B',
  accent: '#291C0E',
};

interface OrderItem {
  id: string;
  menu_item: string;
  quantity: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  delivery_type: string;
  delivery_address: string;
  total_amount: string;
  items: OrderItem[];
  created_at: string;
  user: string;
}

interface MenuItemLite {
  id: string;
  name: string;
}

const STATUS_FLOW: Record<string, { next: string; label: string } | null> = {
  CONFIRMED: { next: 'PREPARING', label: 'Start Preparing' },
  PREPARING: { next: 'READY', label: 'Mark Ready' },
  READY: { next: 'COMPLETED', label: 'Complete Order' },
  COMPLETED: null,
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  CONFIRMED: { bg: `${C.accent}15`, color: C.accent },
  PREPARING: { bg: '#b45a0015', color: '#b45a00' },
  READY: { bg: '#2d5a2d15', color: '#2d5a2d' },
  COMPLETED: { bg: `${C.s1}40`, color: C.s2 },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemLite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [ordersRes, menuRes] = await Promise.all([
        api.get<Order[]>('/orders/admin/all/'),
        api.get<MenuItemLite[]>('/catalog/menu-items/'),
      ]);
      setOrders(ordersRes.data);
      setMenuItems(menuRes.data);
    } catch {
      setError('Could not load orders.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await api.patch(`/orders/admin/${orderId}/status/`, { status: newStatus });
      fetchData();
    } catch {
      setError('Could not update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getItemNames = (items: OrderItem[]) =>
    items.map((item) => {
      const name = menuItems.find((m) => m.id === item.menu_item)?.name || 'Item';
      return `${name} ×${item.quantity}`;
    }).join(', ');

  // Group orders by status
  const grouped = {
    CONFIRMED: orders.filter((o) => o.status === 'CONFIRMED'),
    PREPARING: orders.filter((o) => o.status === 'PREPARING'),
    READY: orders.filter((o) => o.status === 'READY'),
    COMPLETED: orders.filter((o) => o.status === 'COMPLETED'),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: C.s3 }}>Admin</p>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: C.accent }}>
            Kitchen Board
          </h1>
        </div>
        <button onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium"
          style={{ border: `1px solid ${C.s2}`, color: C.s3 }}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl text-sm mb-6"
          style={{ background: '#7a221f15', color: '#7a221f' }}>
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: C.accent }} />
        </div>
      )}

      {!isLoading && orders.length === 0 && (
        <div className="text-center py-20">
          <ShoppingBag className="w-10 h-10 mx-auto mb-3" style={{ color: C.s2 }} />
          <p className="text-sm" style={{ color: C.s3 }}>No active orders.</p>
        </div>
      )}

      {!isLoading && orders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {Object.entries(grouped).map(([status, statusOrders]) => (
            <div key={status}>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase"
                  style={{
                    background: STATUS_COLORS[status]?.bg || `${C.s1}30`,
                    color: STATUS_COLORS[status]?.color || C.s3,
                  }}>
                  {status}
                </span>
                <span className="text-xs" style={{ color: C.s3 }}>({statusOrders.length})</span>
              </div>

              <div className="space-y-3">
                {statusOrders.length === 0 && (
                  <div className="rounded-xl p-4 text-center text-xs" style={{ color: C.s2, border: `1px dashed ${C.s2}50` }}>
                    No orders
                  </div>
                )}

                {statusOrders.map((order) => {
                  const nextStep = STATUS_FLOW[order.status];
                  return (
                    <motion.div key={order.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl p-4" style={{ background: `${C.s1}25`, border: `1px solid ${C.s2}50` }}>
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-bold" style={{ color: C.accent }}>
                          #{order.order_number}
                        </span>
                        <span className="text-[10px]" style={{ color: C.s3 }}>
                          {order.delivery_type === 'DINE_IN' ? 'Dine In' : 'Delivery'}
                        </span>
                      </div>

                      <p className="text-xs mb-3 leading-relaxed" style={{ color: C.s3 }}>
                        {getItemNames(order.items)}
                      </p>

                      {order.delivery_type === 'DELIVERY' && order.delivery_address && (
                        <p className="text-[10px] mb-3 italic" style={{ color: C.s2 }}>
                          📍 {order.delivery_address.slice(0, 60)}...
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: C.accent }}>
                          ₹{parseFloat(order.total_amount).toFixed(0)}
                        </span>
                        {nextStep && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, nextStep.next)}
                            disabled={updatingId === order.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all duration-300 disabled:opacity-50"
                            style={{ background: C.accent, color: C.bg }}
                          >
                            {updatingId === order.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <ArrowRight className="w-3 h-3" />
                            }
                            {nextStep.label}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}