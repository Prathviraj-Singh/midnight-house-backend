'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Clock, Users, Film, MessageSquare,
  Loader2, CheckCircle2, AlertCircle, Tv, Minus, Plus,
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

interface BusyTime {
  start_time: string;
  end_time: string;
}

interface BusyTimesResponse {
  date: string;
  busy_times: BusyTime[];
  opening_time: string;
  closing_time: string;
  min_duration_hours: number;
  max_duration_hours: number;
}

type Step = 'date' | 'time' | 'details' | 'success';

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isPastDate(d: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

function isToday(d: Date): boolean {
  return toISODate(d) === toISODate(new Date());
}

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTimeLabel(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function minutesToTimeString(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function CalendarGrid({ selectedDate, onSelect }: { selectedDate: Date | null; onSelect: (d: Date) => void }) {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const goPrev = () => setViewDate(new Date(year, month - 1, 1));
  const goNext = () => setViewDate(new Date(year, month + 1, 1));

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const today = new Date();
  const minMonth = today.getFullYear() * 12 + today.getMonth();
  const curMonth = year * 12 + month;

  return (
    <div className="rounded-2xl p-6" style={{ background: `${C.s1}25`, border: `1px solid ${C.s2}50` }}>
      <div className="flex items-center justify-between mb-6">
        <button onClick={goPrev} disabled={curMonth <= minMonth}
          className="p-2 rounded-full transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed"
          style={{ background: `${C.s1}40`, color: C.accent }}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-lg font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: C.accent }}>
          {MONTH_NAMES[month]} {year}
        </h3>
        <button onClick={goNext} className="p-2 rounded-full transition-all duration-200"
          style={{ background: `${C.s1}40`, color: C.accent }}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_NAMES.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium tracking-wider uppercase py-1" style={{ color: C.s3 }}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const past = isPastDate(date);
          const isSelected = selectedDate && toISODate(date) === toISODate(selectedDate);
          const today_ = toISODate(date) === toISODate(new Date());
          return (
            <button key={i} disabled={past} onClick={() => onSelect(date)}
              className="aspect-square rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed relative"
              style={{ background: isSelected ? C.accent : 'transparent', color: isSelected ? C.bg : C.accent }}
              onMouseEnter={(e) => { if (!past && !isSelected) e.currentTarget.style.background = `${C.s2}40`; }}
              onMouseLeave={(e) => { if (!past && !isSelected) e.currentTarget.style.background = 'transparent'; }}>
              {date.getDate()}
              {today_ && !isSelected && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: C.accent }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BookingPageContent() {
  const [step, setStep] = useState<Step>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [busyData, setBusyData] = useState<BusyTimesResponse | null>(null);
  const [isLoadingBusy, setIsLoadingBusy] = useState(false);
  const [busyError, setBusyError] = useState('');

  const [duration, setDuration] = useState(2); // hours
  const [selectedStartMin, setSelectedStartMin] = useState<number | null>(null);

  const [movieName, setMovieName] = useState('');
  const [guests, setGuests] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const pricePerGuest = 250;
  const totalAmount = useMemo(() => guests * pricePerGuest, [guests]);
  const advanceAmount = useMemo(() => totalAmount / 2, [totalAmount]);

  useEffect(() => {
    if (!selectedDate) return;
    const fetchBusy = async () => {
      setIsLoadingBusy(true);
      setBusyError('');
      setSelectedStartMin(null);
      try {
        const res = await api.get<BusyTimesResponse>(`/bookings/busy/?date=${toISODate(selectedDate)}`);
        setBusyData(res.data);
      } catch {
        setBusyError('Could not load availability. Please try again.');
      } finally {
        setIsLoadingBusy(false);
      }
    };
    fetchBusy();
  }, [selectedDate]);

  const handleDateSelect = (d: Date) => {
    setSelectedDate(d);
    setStep('time');
  };

  // ── Compute open/close in minutes + min start (advance notice for today) ──
  const openMin = busyData ? parseTimeToMinutes(busyData.opening_time) : 600;
  const closeMin = busyData ? parseTimeToMinutes(busyData.closing_time) : 1439;

  const earliestStartMin = useMemo(() => {
    if (!selectedDate || !isToday(selectedDate)) return openMin;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes() + 120; // 2hr advance notice
    // round up to next 30-min mark
    const rounded = Math.ceil(nowMin / 30) * 30;
    return Math.max(openMin, rounded);
  }, [selectedDate, openMin]);

  // ── Generate 30-min start chips ──
  const startChips = useMemo(() => {
    const chips: number[] = [];
    const durationMin = duration * 60;
    const lastStart = closeMin - durationMin;
    for (let t = earliestStartMin; t <= lastStart; t += 30) {
      chips.push(t);
    }
    return chips;
  }, [earliestStartMin, closeMin, duration]);

  const isChipAvailable = useCallback((startMin: number) => {
    if (!busyData) return true;
    const endMin = startMin + duration * 60;
    return !busyData.busy_times.some((bt) => {
      const busyStart = parseTimeToMinutes(bt.start_time);
      const busyEnd = parseTimeToMinutes(bt.end_time);
      return startMin < busyEnd && endMin > busyStart;
    });
  }, [busyData, duration]);

  // Clear selection if it becomes invalid when duration changes
  useEffect(() => {
    if (selectedStartMin !== null && !isChipAvailable(selectedStartMin)) {
      setSelectedStartMin(null);
    }
  }, [duration, isChipAvailable, selectedStartMin]);

  const handleSubmit = async () => {
    if (!selectedDate || selectedStartMin === null || !movieName.trim()) {
      setSubmitError('Please fill in the movie name before submitting.');
      return;
    }
    setSubmitError('');
    setIsSubmitting(true);
    try {
      await api.post('/bookings/', {
        movie_name: movieName.trim(),
        booking_date: toISODate(selectedDate),
        start_time: minutesToTimeString(selectedStartMin),
        end_time: minutesToTimeString(selectedStartMin + duration * 60),
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
    setStep('date');
    setSelectedDate(null);
    setBusyData(null);
    setSelectedStartMin(null);
    setDuration(2);
    setMovieName('');
    setGuests(2);
    setSpecialRequests('');
    setSubmitError('');
  };

  // ── Timeline visual percentages ──
  const totalRange = closeMin - openMin;
  const busyBlocks = useMemo(() => {
    if (!busyData) return [];
    return busyData.busy_times.map((bt) => {
      const s = parseTimeToMinutes(bt.start_time);
      const e = parseTimeToMinutes(bt.end_time);
      return {
        left: ((s - openMin) / totalRange) * 100,
        width: ((e - s) / totalRange) * 100,
        label: `${minutesToTimeLabel(s)} - ${minutesToTimeLabel(e)}`,
      };
    });
  }, [busyData, openMin, totalRange]);

  const selectedBlock = selectedStartMin !== null ? {
    left: ((selectedStartMin - openMin) / totalRange) * 100,
    width: ((duration * 60) / totalRange) * 100,
  } : null;

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.accent }}>
      <header className="pt-32 pb-12 px-8 md:px-20 text-center">
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-[10px] tracking-[0.35em] uppercase mb-4" style={{ color: C.accent }}>
          Exclusive Experience
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
          Book the Private Theater
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-sm max-w-lg mx-auto" style={{ color: C.s3 }}>
          Choose any time that works for you. Up to 8 guests, ₹250 per guest.
        </motion.p>
      </header>

      <div className="flex items-center justify-center gap-2 mb-12 px-8">
        {(['date', 'time', 'details', 'success'] as Step[]).map((s, i) => {
          const stepOrder: Step[] = ['date', 'time', 'details', 'success'];
          const currentIdx = stepOrder.indexOf(step);
          const thisIdx = stepOrder.indexOf(s);
          const active = thisIdx <= currentIdx;
          return (
            <div key={s} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300"
                style={{ background: active ? C.accent : `${C.s1}50`, color: active ? C.bg : C.s3 }}>
                {i + 1}
              </div>
              {i < 3 && <div className="w-8 h-px" style={{ background: active && thisIdx < currentIdx ? C.accent : C.s2 }} />}
            </div>
          );
        })}
      </div>

      <div className="px-8 md:px-20 pb-32">
        <div className="max-w-xl mx-auto">
          <AnimatePresence mode="wait">

            {step === 'date' && (
              <motion.div key="date" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-sm font-medium mb-4 text-center" style={{ color: C.s3 }}>Select a Date</h2>
                <CalendarGrid selectedDate={selectedDate} onSelect={handleDateSelect} />
              </motion.div>
            )}

            {step === 'time' && selectedDate && (
              <motion.div key="time" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button onClick={() => setStep('date')} className="flex items-center gap-1 text-xs mb-6" style={{ color: C.s3 }}>
                  <ChevronLeft className="w-3 h-3" /> Change date
                </button>
                <p className="text-lg font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: C.accent }}>
                  {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <p className="text-xs mb-6" style={{ color: C.s3 }}>Pick your preferred time below.</p>

                {isLoadingBusy && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: C.accent }} />
                  </div>
                )}

                {busyError && (
                  <div className="flex items-center gap-2 p-4 rounded-xl text-sm" style={{ background: '#7a221f15', color: '#7a221f' }}>
                    <AlertCircle className="w-4 h-4" /> {busyError}
                  </div>
                )}

                {!isLoadingBusy && !busyError && busyData && (
                  <>
                    {/* Duration stepper */}
                    <div className="flex items-center justify-between mb-5 p-4 rounded-xl" style={{ background: `${C.s1}30`, border: `1px solid ${C.s2}50` }}>
                      <span className="text-xs font-medium" style={{ color: C.s3 }}>Duration</span>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setDuration((d) => Math.max(busyData.min_duration_hours, d - 0.5))}
                          className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${C.s1}50`, color: C.accent }}>
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-semibold w-20 text-center" style={{ color: C.accent }}>
                          {duration} hour{duration !== 1 ? 's' : ''}
                        </span>
                        <button onClick={() => setDuration((d) => Math.min(busyData.max_duration_hours, d + 0.5))}
                          className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${C.s1}50`, color: C.accent }}>
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Visual timeline */}
                    <div className="mb-2 flex justify-between text-[10px]" style={{ color: C.s2 }}>
                      <span>{minutesToTimeLabel(openMin)}</span>
                      <span>{minutesToTimeLabel(closeMin)}</span>
                    </div>
                    <div className="relative h-10 rounded-lg mb-6 overflow-hidden" style={{ background: `${C.s1}40` }}>
                      {busyBlocks.map((b, i) => (
                        <div key={i} className="absolute top-0 bottom-0 flex items-center justify-center"
                          style={{ left: `${b.left}%`, width: `${b.width}%`, background: '#7a221f50' }}
                          title={b.label} />
                      ))}
                      {selectedBlock && (
                        <motion.div
                          layout
                          className="absolute top-0 bottom-0 rounded"
                          style={{ left: `${selectedBlock.left}%`, width: `${selectedBlock.width}%`, background: C.accent }}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-4 mb-6 text-[10px]" style={{ color: C.s3 }}>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#7a221f50' }} /> Booked</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: C.accent }} /> Your Selection</span>
                    </div>

                    {/* Start time chips */}
                    <p className="text-xs font-medium mb-3" style={{ color: C.s3 }}>Available start times</p>
                    {startChips.length === 0 ? (
                      <p className="text-sm py-6 text-center" style={{ color: C.s3 }}>
                        No slots available for this duration today. Try a shorter duration or another date.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 mb-8">
                        {startChips.map((t) => {
                          const available = isChipAvailable(t);
                          const isSelected = selectedStartMin === t;
                          return (
                            <button
                              key={t}
                              disabled={!available}
                              onClick={() => setSelectedStartMin(t)}
                              className="py-2.5 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed disabled:line-through"
                              style={{
                                background: isSelected ? C.accent : `${C.s1}30`,
                                color: isSelected ? C.bg : C.accent,
                                border: `1px solid ${isSelected ? C.accent : C.s2}60`,
                              }}
                            >
                              {minutesToTimeLabel(t)}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <button
                      onClick={() => setStep('details')}
                      disabled={selectedStartMin === null}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: C.accent, color: C.bg }}
                    >
                      Continue <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {step === 'details' && selectedDate && selectedStartMin !== null && (
              <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button onClick={() => setStep('time')} className="flex items-center gap-1 text-xs mb-6" style={{ color: C.s3 }}>
                  <ChevronLeft className="w-3 h-3" /> Change time
                </button>

                <div className="flex items-center gap-3 p-4 rounded-xl mb-6" style={{ background: `${C.accent}10`, border: `1px solid ${C.accent}30` }}>
                  <Tv className="w-4 h-4" style={{ color: C.accent }} />
                  <div className="text-xs" style={{ color: C.accent }}>
                    <strong>{selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</strong>
                    {' · '}{minutesToTimeLabel(selectedStartMin)} – {minutesToTimeLabel(selectedStartMin + duration * 60)}
                    {' '}({duration}h)
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-medium mb-1.5" style={{ color: C.s3 }}>
                      <Film className="w-3.5 h-3.5" /> Movie / Screening Title
                    </label>
                    <input
                      type="text"
                      value={movieName}
                      onChange={(e) => setMovieName(e.target.value)}
                      placeholder="e.g. Interstellar"
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                      style={{ background: `${C.bg}90`, border: `1px solid ${C.s2}80`, color: C.accent }}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs font-medium mb-1.5" style={{ color: C.s3 }}>
                      <Users className="w-3.5 h-3.5" /> Number of Guests (max 8)
                    </label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setGuests((g) => Math.max(1, g - 1))}
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold" style={{ background: `${C.s1}50`, color: C.accent }}>−</button>
                      <span className="text-lg font-semibold w-8 text-center" style={{ color: C.accent }}>{guests}</span>
                      <button onClick={() => setGuests((g) => Math.min(8, g + 1))}
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
                      placeholder="Decorations, snacks, anything else..."
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                      style={{ background: `${C.bg}90`, border: `1px solid ${C.s2}80`, color: C.accent }}
                    />
                  </div>

                  <div className="rounded-xl p-5 space-y-2" style={{ background: `${C.s1}30`, border: `1px solid ${C.s2}50` }}>
                    <div className="flex justify-between text-xs" style={{ color: C.s3 }}>
                      <span>Total ({guests} × ₹{pricePerGuest})</span>
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
                  Your booking is now <strong style={{ color: C.accent }}>pending approval</strong>.
                  We&apos;ll review it shortly — once approved, you can complete your advance payment from your dashboard.
                </p>
                <button onClick={resetFlow} className="mt-8 px-8 py-3 rounded-full text-sm font-medium"
                  style={{ background: `${C.s1}40`, color: C.accent, border: `1px solid ${C.s2}` }}>
                  Book Another Slot
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <ProtectedRoute>
      <BookingPageContent />
    </ProtectedRoute>
  );
}