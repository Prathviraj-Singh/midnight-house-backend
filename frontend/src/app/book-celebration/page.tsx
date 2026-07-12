'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Users, MessageSquare, Gift,
  Loader2, CheckCircle2, AlertCircle, PartyPopper,
} from 'lucide-react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

const C = {
  bg: '#E1D4C2',
  s1: '#BEB5A9',
  s2: '#A78D78',
  s3: '#6E473B',
  accent: '#291C0E',
};

type Step = 'package' | 'details' | 'success';

type PackageType = 'ESSENTIAL' | 'PREMIUM' | 'FAREWELL';

const PACKAGES: { key: PackageType; name: string; price: number; desc: string; highlight?: boolean }[] = [
  { key: 'ESSENTIAL', name: 'Essential', price: 1499, desc: 'Intimate setup · Up to 15 guests' },
  { key: 'PREMIUM', name: 'Premium', price: 2999, desc: 'Full experience + Theater access', highlight: true },
  { key: 'FAREWELL', name: 'Farewell', price: 1999, desc: 'Memory board · Group food order' },
];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function CelebrationPageContent() {
  const [step, setStep] = useState<Step>('package');
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);

  const [occasionName, setOccasionName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [guests, setGuests] = useState(5);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const packageInfo = PACKAGES.find((p) => p.key === selectedPackage);
  const totalAmount = packageInfo?.price ?? 0;
  const advanceAmount = useMemo(() => totalAmount / 2, [totalAmount]);

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // 24hr advance notice
    return toISODate(d);
  }, []);

  const handlePackageSelect = (pkg: PackageType) => {
    setSelectedPackage(pkg);
    setStep('details');
  };

  const handleSubmit = async () => {
    if (!selectedPackage || !occasionName.trim() || !eventDate) {
      setSubmitError('Please fill in the occasion name and event date.');
      return;
    }
    setSubmitError('');
    setIsSubmitting(true);
    try {
      await api.post('/bookings/celebrations/', {
        package_type: selectedPackage,
        occasion_name: occasionName.trim(),
        event_date: eventDate,
        number_of_guests: guests,
        special_requests: specialRequests.trim(),
      });
      setStep('success');
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[] | string> } };
      const data = e?.response?.data;
      let msg = 'Could not submit your booking request. Please try again.';
      if (data) {
        const firstKey = Object.keys(data)[0];
        const val = data[firstKey];
        msg = Array.isArray(val) ? val[0] : String(val);
      }
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFlow = () => {
    setStep('package');
    setSelectedPackage(null);
    setOccasionName('');
    setEventDate('');
    setGuests(5);
    setSpecialRequests('');
    setSubmitError('');
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.accent }}>
      <header className="pt-32 pb-12 px-8 md:px-20 text-center">
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-[10px] tracking-[0.35em] uppercase mb-4" style={{ color: C.accent }}>
          Celebrate in Style
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
          Book a Celebration
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-sm max-w-lg mx-auto" style={{ color: C.s3 }}>
          Up to 15 guests. Decorated space, curated food, entirely yours.
        </motion.p>
      </header>

      <div className="px-8 md:px-20 pb-32">
        <div className="max-w-xl mx-auto">
          <AnimatePresence mode="wait">

            {step === 'package' && (
              <motion.div key="package" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-sm font-medium mb-4 text-center" style={{ color: C.s3 }}>Choose a Package</h2>
                <div className="space-y-3">
                  {PACKAGES.map((p) => (
                    <button key={p.key} onClick={() => handlePackageSelect(p.key)}
                      className="w-full flex items-center justify-between p-5 rounded-xl transition-all duration-300 text-left"
                      style={{
                        background: p.highlight ? `${C.accent}10` : `${C.s1}35`,
                        border: p.highlight ? `1px solid ${C.accent}50` : `1px solid ${C.s2}50`,
                      }}>
                      <div>
                        <div className="font-semibold text-sm mb-0.5" style={{ color: C.accent }}>
                          {p.name}
                          {p.highlight && <span className="ml-2 text-[9px] px-2 py-0.5 rounded-full tracking-widest uppercase" style={{ background: `${C.accent}15`, color: C.accent }}>Popular</span>}
                        </div>
                        <div className="text-xs" style={{ color: C.s3 }}>{p.desc}</div>
                      </div>
                      <div className="text-lg font-bold" style={{ color: C.accent, fontFamily: "'Playfair Display',serif" }}>₹{p.price}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 'details' && packageInfo && (
              <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button onClick={() => setStep('package')} className="flex items-center gap-1 text-xs mb-6" style={{ color: C.s3 }}>
                  <ChevronLeft className="w-3 h-3" /> Change package
                </button>

                <div className="flex items-center gap-3 p-4 rounded-xl mb-6" style={{ background: `${C.accent}10`, border: `1px solid ${C.accent}30` }}>
                  <PartyPopper className="w-4 h-4" style={{ color: C.accent }} />
                  <div className="text-xs" style={{ color: C.accent }}>
                    <strong>{packageInfo.name} Package</strong> · ₹{packageInfo.price}
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-medium mb-1.5" style={{ color: C.s3 }}>
                      <Gift className="w-3.5 h-3.5" /> Occasion Name
                    </label>
                    <input
                      type="text"
                      value={occasionName}
                      onChange={(e) => setOccasionName(e.target.value)}
                      placeholder="e.g. Riya's Birthday"
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                      style={{ background: `${C.bg}90`, border: `1px solid ${C.s2}80`, color: C.accent }}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs font-medium mb-1.5" style={{ color: C.s3 }}>
                      Event Date
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      min={minDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                      style={{ background: `${C.bg}90`, border: `1px solid ${C.s2}80`, color: C.accent }}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs font-medium mb-1.5" style={{ color: C.s3 }}>
                      <Users className="w-3.5 h-3.5" /> Number of Guests (max 15)
                    </label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setGuests((g) => Math.max(1, g - 1))}
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold" style={{ background: `${C.s1}50`, color: C.accent }}>−</button>
                      <span className="text-lg font-semibold w-8 text-center" style={{ color: C.accent }}>{guests}</span>
                      <button onClick={() => setGuests((g) => Math.min(15, g + 1))}
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold" style={{ background: `${C.s1}50`, color: C.accent }}>+</button>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs font-medium mb-1.5" style={{ color: C.s3 }}>
                      <MessageSquare className="w-3.5 h-3.5" /> Special Requests (optional)
                    </label>
                    <textarea
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      rows={3}
                      placeholder="Decorations, cake, anything else..."
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                      style={{ background: `${C.bg}90`, border: `1px solid ${C.s2}80`, color: C.accent }}
                    />
                  </div>

                  <div className="rounded-xl p-5 space-y-2" style={{ background: `${C.s1}30`, border: `1px solid ${C.s2}50` }}>
                    <div className="flex justify-between text-xs" style={{ color: C.s3 }}>
                      <span>Package Total</span>
                      <span>₹{totalAmount}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold" style={{ color: C.accent }}>
                      <span>Advance Payable on Approval</span>
                      <span>₹{advanceAmount}</span>
                    </div>
                  </div>

                  {submitError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl text-xs" style={{ background: '#7a221f15', color: '#7a221f' }}>
                      <AlertCircle className="w-4 h-4 shrink-0" /> {submitError}
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full rounded-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60"
                    style={{ background: C.accent, color: C.bg }}
                  >
                    {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit Booking Request'}
                  </button>
                  <p className="text-[11px] text-center" style={{ color: C.s2 }}>
                    Your request will be reviewed by our team. You&apos;ll be notified once approved, then payment can be completed.
                  </p>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: `${C.accent}15` }}>
                  <CheckCircle2 className="w-8 h-8" style={{ color: C.accent }} />
                </motion.div>
                <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: C.accent }}>
                  Request Submitted
                </h2>
                <p className="text-sm mb-2 max-w-sm mx-auto" style={{ color: C.s3 }}>
                  Your celebration booking is now <strong style={{ color: C.accent }}>pending approval</strong>.
                  We&apos;ll review it shortly — once approved, you can complete your advance payment from your dashboard.
                </p>
                <button onClick={resetFlow} className="mt-8 px-8 py-3 rounded-full text-sm font-medium"
                  style={{ background: `${C.s1}40`, color: C.accent, border: `1px solid ${C.s2}` }}>
                  Book Another Celebration
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function CelebrationBookingPage() {
  return (
    <ProtectedRoute>
      <CelebrationPageContent />
    </ProtectedRoute>
  );
}