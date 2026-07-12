'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

const C = {
  bg: '#E1D4C2',
  s1: '#BEB5A9',
  s2: '#A78D78',
  s3: '#6E473B',
  accent: '#291C0E',
};

// Internal MenuItem used purely to attach overall-experience reviews to.
// is_available=False on this item, so it never appears on the public menu.
const OVERALL_EXPERIENCE_MENU_ITEM_ID = '928646db-0d21-47ba-a78f-7b17f90b272f';

function ReviewPageContent() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating before submitting.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await api.post('/reviews/', {
        menu_item: OVERALL_EXPERIENCE_MENU_ITEM_ID,
        rating,
        comment: comment.trim(),
      });
      setSubmitted(true);
    } catch {
      setError('Could not submit your review right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.accent }}>
      <header className="pt-32 pb-10 px-8 md:px-20 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-[10px] tracking-[0.35em] uppercase mb-4" style={{ color: C.accent }}
        >
          Your Voice Matters
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="font-bold mb-4"
          style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
        >
          Share Your Experience
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-sm max-w-lg mx-auto" style={{ color: C.s3 }}
        >
          Tell us how your visit to Midnight House went — every review helps us serve you better.
        </motion.p>
      </header>

      <div className="px-8 md:px-20 pb-32">
        <div className="max-w-xl mx-auto">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring' }}
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: `${C.accent}15` }}
                >
                  <CheckCircle2 className="w-8 h-8" style={{ color: C.accent }} />
                </motion.div>
                <h2
                  className="text-2xl font-bold mb-3"
                  style={{ fontFamily: "'Playfair Display', serif", color: C.accent }}
                >
                  Thank You
                </h2>
                <p className="text-sm" style={{ color: C.s3 }}>
                  Your review has been submitted and will appear once approved by our team.
                </p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div
                  className="rounded-2xl p-8"
                  style={{ background: `${C.s1}25`, border: `1px solid ${C.s2}50` }}
                >
                  <label className="block text-xs font-medium tracking-wide uppercase mb-3 text-center" style={{ color: C.s3 }}>
                    How would you rate us?
                  </label>
                  <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setRating(n)}
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                        className="transition-transform duration-150 hover:scale-110"
                      >
                        <Star
                          className="w-9 h-9"
                          fill={n <= (hoverRating || rating) ? C.accent : 'none'}
                          style={{ color: C.accent }}
                          strokeWidth={1.5}
                        />
                      </button>
                    ))}
                  </div>

                  <label className="block text-xs font-medium tracking-wide uppercase mb-2" style={{ color: C.s3 }}>
                    Tell us more <span style={{ fontWeight: 400, opacity: 0.7 }}>(optional)</span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={5}
                    placeholder="What did you enjoy? What could we do better?"
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none mb-6"
                    style={{ background: `${C.bg}90`, border: `1px solid ${C.s2}80`, color: C.accent }}
                  />

                  {error && (
                    <div
                      className="flex items-center gap-2 p-3 rounded-xl text-sm mb-6"
                      style={{ background: '#7a221f15', color: '#7a221f' }}
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-sm transition-all duration-300 disabled:opacity-60"
                    style={{ background: C.accent, color: C.bg }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
                      </>
                    ) : (
                      'Submit Review'
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <ProtectedRoute>
      <ReviewPageContent />
    </ProtectedRoute>
  );
}