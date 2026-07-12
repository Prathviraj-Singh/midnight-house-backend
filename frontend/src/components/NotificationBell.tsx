'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, ClipboardList, Tag, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

const C = {
  bg: '#E1D4C2',
  s1: '#BEB5A9',
  s2: '#A78D78',
  s3: '#6E473B',
  accent: '#291C0E',
};

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: 'BOOKING' | 'ORDER' | 'OFFER';
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get<{ unread_count: number }>('/notifications/unread-count/');
      setUnreadCount(res.data.unread_count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<Notification[]>('/notifications/');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch of unread count on mount only — no polling
    fetchUnreadCount();
  }, []);

  // When dropdown is opened, fetch the actual notifications list and refresh count
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isOpen]);

  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      // Optimistic UI update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await api.patch(`/notifications/${id}/read/`);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Revert/refresh on failure
      fetchNotifications();
      fetchUnreadCount();
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Optimistic UI update
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);

      await api.patch('/notifications/mark-all-read/');
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      fetchNotifications();
      fetchUnreadCount();
    }
  };

  const getNotificationIcon = (type: Notification['notification_type']) => {
    switch (type) {
      case 'BOOKING':
        return <Calendar className="w-4 h-4 text-emerald-600" />;
      case 'ORDER':
        return <ClipboardList className="w-4 h-4 text-blue-600" />;
      case 'OFFER':
        return <Tag className="w-4 h-4 text-amber-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };
// Don't render if user is not authenticated
  if (!user) return null;
  return (
    <div className="relative animate-fadeIn" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full transition-all duration-300 hover:scale-105"
        style={{
          background: isOpen ? `${C.s1}80` : `${C.s1}40`,
          color: C.accent,
        }}
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse"
            style={{ background: '#E05D5D', color: '#FFF' }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80 rounded-2xl shadow-2xl border overflow-hidden z-50"
            style={{
              background: '#FFF',
              borderColor: `${C.s2}30`,
            }}
          >
            {/* Header */}
            <div
              className="px-4 py-3 flex items-center justify-between border-b"
              style={{ borderColor: `${C.s2}20` }}
            >
              <h3
                className="text-[11px] font-bold tracking-[0.15em] uppercase"
                style={{ color: C.accent, fontFamily: "'Playfair Display', serif" }}
              >
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] tracking-wider uppercase font-semibold hover:underline transition-all"
                  style={{ color: C.s3 }}
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
              {isLoading && notifications.length === 0 ? (
                <div className="flex justify-center items-center py-8">
                  <div
                    className="w-5 h-5 rounded-full animate-spin"
                    style={{ border: '2px solid rgba(41,28,14,0.1)', borderTopColor: C.accent }}
                  />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 px-4 text-xs" style={{ color: C.s3 }}>
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                    className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors duration-200 ${
                      n.is_read ? 'hover:bg-gray-50' : 'bg-amber-50/30 hover:bg-amber-50/50'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: n.is_read ? '#F3F4F6' : '#FEF3C7' }}
                      >
                        {getNotificationIcon(n.notification_type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p
                          className={`text-xs truncate ${
                            n.is_read ? 'text-gray-700' : 'font-semibold text-gray-900'
                          }`}
                        >
                          {n.title}
                        </p>
                        <span className="text-[9px] text-gray-400 whitespace-nowrap ml-2">
                          {formatTimeAgo(n.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="flex-shrink-0 self-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}