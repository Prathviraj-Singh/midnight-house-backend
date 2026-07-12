'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Check, Trash2, Loader2, AlertCircle, MessageSquareOff } from 'lucide-react';
import api from '@/lib/api';

const C = {
  bg: '#E1D4C2',
  s1: '#BEB5A9',
  s2: '#A78D78',
  s3: '#6E473B',
  accent: '#291C0E',
};

interface Review {
  id: string;
  user: number;
  user_name: string;
  menu_item: string;
  menu_item_name: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
}

type FilterTab = 'pending' | 'approved' | 'all';

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className="w-3.5 h-3.5"
          fill={n <= rating ? C.accent : 'none'}
          style={{ color: C.accent }}
        />
      ))}
    </div>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminReviewsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('pending');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null);

  const fetchReviews = useCallback(async (tab: FilterTab) => {
    setIsLoading(true);
    setError('');
    try {
      const params = tab === 'all' ? {} : { status: tab };
      const res = await api.get<Review[]>('/reviews/admin/all/', { params });
      setReviews(res.data);
    } catch {
      setError('Could not load reviews right now.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews(activeTab);
  }, [activeTab, fetchReviews]);

  const handleApprove = async (id: string) => {
    setActioningId(id);
    try {
      await api.patch(`/reviews/admin/${id}/approve/`);
      setReviews((prev) =>
        activeTab === 'pending'
          ? prev.filter((r) => r.id !== id)
          : prev.map((r) => (r.id === id ? { ...r, is_approved: true } : r))
      );
    } catch {
      setError('Could not approve this review. Please try again.');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActioningId(id);
    try {
      await api.delete(`/reviews/admin/${id}/reject/`);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setConfirmRejectId(null);
    } catch {
      setError('Could not reject this review. Please try again.');
    } finally {
      setActioningId(null);
    }
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'all', label: 'All' },
  ];

  return (
    <div style={{ color: C.accent }}>
      <div className="mb-8">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "'Playfair Display', serif", color: C.accent }}
        >
          Reviews
        </h1>
        <p className="text-sm" style={{ color: C.s3 }}>
          Moderate customer reviews before they go live on the menu page.
        </p>
      </div>

      <div className="flex gap-3 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-5 py-2 rounded-full text-xs font-medium tracking-wide uppercase transition-all duration-300"
            style={{
              background: activeTab === tab.key ? C.accent : `${C.s1}30`,
              color: activeTab === tab.key ? C.bg : C.s3,
              border: `1px solid ${activeTab === tab.key ? C.accent : C.s2}`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div
          className="flex items-center gap-2 p-4 rounded-xl text-sm mb-6"
          style={{ background: '#7a221f15', color: '#7a221f' }}
        >
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: C.accent }} />
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <MessageSquareOff className="w-8 h-8" style={{ color: C.s2 }} />
          <p className="text-sm" style={{ color: C.s3 }}>
            No {activeTab !== 'all' ? activeTab : ''} reviews to show.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="rounded-2xl p-5 flex flex-col"
                style={{ background: `${C.s1}25`, border: `1px solid ${C.s2}50` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: C.accent }}>
                      {review.user_name}
                    </p>
                    <p className="text-[11px]" style={{ color: C.s3 }}>
                      on {review.menu_item_name}
                    </p>
                  </div>
                  <span
                    className="text-[9px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full shrink-0"
                    style={{
                      background: review.is_approved ? '#2d5a2d15' : `${C.s2}40`,
                      color: review.is_approved ? '#2d5a2d' : C.accent,
                    }}
                  >
                    {review.is_approved ? 'Approved' : 'Pending'}
                  </span>
                </div>

                <StarRow rating={review.rating} />

                <p className="text-xs leading-relaxed mt-3 mb-3 flex-1" style={{ color: C.s3 }}>
                  {review.comment || <span className="opacity-60">No comment provided.</span>}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: C.s2 }}>
                    {formatDate(review.created_at)}
                  </span>

                  <div className="flex items-center gap-2">
                    {!review.is_approved && (
                      <button
                        onClick={() => handleApprove(review.id)}
                        disabled={actioningId === review.id}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-300 disabled:opacity-50"
                        style={{ background: '#2d5a2d', color: '#fff' }}
                      >
                        {actioningId === review.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        Approve
                      </button>
                    )}

                    {confirmRejectId === review.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px]" style={{ color: '#7a221f' }}>
                          Delete permanently?
                        </span>
                        <button
                          onClick={() => handleReject(review.id)}
                          disabled={actioningId === review.id}
                          className="px-2.5 py-1.5 rounded-full text-[11px] font-semibold disabled:opacity-50"
                          style={{ background: '#7a221f', color: '#fff' }}
                        >
                          {actioningId === review.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            'Yes'
                          )}
                        </button>
                        <button
                          onClick={() => setConfirmRejectId(null)}
                          className="px-2.5 py-1.5 rounded-full text-[11px] font-semibold"
                          style={{ background: `${C.s2}40`, color: C.accent }}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRejectId(review.id)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-300"
                        style={{ background: '#7a221f15', color: '#7a221f' }}
                      >
                        <Trash2 className="w-3 h-3" />
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}