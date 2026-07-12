'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, AlertCircle, Calendar, Clock, Users, Film,
  CheckCircle2, XCircle, RefreshCw, Clock3, Gift, PartyPopper,
} from 'lucide-react';
import api from '@/lib/api';

const C = {
  bg: '#E1D4C2',
  s1: '#BEB5A9',
  s2: '#A78D78',
  s3: '#6E473B',
  accent: '#291C0E',
};

interface Booking {
  id: string;
  movie_name: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  number_of_guests: number;
  special_requests: string;
  booking_status: string;
  total_amount: string;
  advance_amount: string;
  user: string;
  created_at: string;
}

interface CelebrationBooking {
  id: string;
  package_type: string;
  occasion_name: string;
  event_date: string;
  number_of_guests: number;
  special_requests: string;
  booking_status: string;
  total_amount: string;
  advance_amount: string;
  user: string;
  created_at: string;
}

type Filter = 'PENDING' | 'APPROVED' | 'ALL';
type BookingType = 'THEATER' | 'CELEBRATION';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    PENDING: { bg: `${C.s2}25`, color: C.s3, label: 'Pending' },
    APPROVED: { bg: `${C.accent}15`, color: C.accent, label: 'Approved' },
    REJECTED: { bg: '#7a221f15', color: '#7a221f', label: 'Rejected' },
    CONFIRMED: { bg: '#2d5a2d15', color: '#2d5a2d', label: 'Confirmed' },
    CANCELLED: { bg: `${C.s1}40`, color: C.s2, label: 'Cancelled' },
  };
  const s = map[status] || map.PENDING;
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

export default function AdminBookingsPage() {
  const [bookingType, setBookingType] = useState<BookingType>('THEATER');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [celebrations, setCelebrations] = useState<CelebrationBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('PENDING');
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      if (bookingType === 'THEATER') {
        const url = filter === 'ALL'
          ? '/bookings/admin/all/'
          : `/bookings/admin/all/?status=${filter}`;
        const res = await api.get<Booking[]>(url);
        setBookings(res.data);
      } else {
        const url = filter === 'ALL'
          ? '/bookings/celebrations/admin/all/'
          : `/bookings/celebrations/admin/all/?status=${filter}`;
        const res = await api.get<CelebrationBooking[]>(url);
        setCelebrations(res.data);
      }
    } catch {
      setError('Could not load bookings.');
    } finally {
      setIsLoading(false);
    }
  }, [filter, bookingType]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      const base = bookingType === 'THEATER' ? '/bookings' : '/bookings/celebrations';
      await api.post(`${base}/${id}/approve/`);
      fetchBookings();
    } catch {
      setError('Could not approve booking.');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionId(id);
    try {
      const base = bookingType === 'THEATER' ? '/bookings' : '/bookings/celebrations';
      await api.post(`${base}/${id}/reject/`);
      fetchBookings();
    } catch {
      setError('Could not reject booking.');
    } finally {
      setActionId(null);
    }
  };

  const handleExpireUnpaid = async () => {
    try {
      const res = await api.post<{ detail: string }>('/bookings/admin/expire-unpaid/');
      alert(res.data.detail);
      fetchBookings();
    } catch {
      setError('Could not expire unpaid bookings.');
    }
  };

  const list = bookingType === 'THEATER' ? bookings : celebrations;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: C.s3 }}>Admin</p>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: C.accent }}>
            Bookings
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {bookingType === 'THEATER' && (
            <button onClick={handleExpireUnpaid}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-300"
              style={{ border: `1px solid ${C.s2}`, color: C.s3 }}>
              <Clock3 className="w-3.5 h-3.5" /> Expire Unpaid
            </button>
          )}
          <button onClick={fetchBookings}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-300"
            style={{ border: `1px solid ${C.s2}`, color: C.s3 }}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Type tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setBookingType('THEATER')}
          className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-medium tracking-wide uppercase transition-all duration-300"
          style={{
            background: bookingType === 'THEATER' ? C.accent : `${C.s1}30`,
            color: bookingType === 'THEATER' ? C.bg : C.s3,
            border: `1px solid ${bookingType === 'THEATER' ? C.accent : C.s2}50`,
          }}>
          <Film className="w-3.5 h-3.5" /> Theater
        </button>
        <button onClick={() => setBookingType('CELEBRATION')}
          className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-medium tracking-wide uppercase transition-all duration-300"
          style={{
            background: bookingType === 'CELEBRATION' ? C.accent : `${C.s1}30`,
            color: bookingType === 'CELEBRATION' ? C.bg : C.s3,
            border: `1px solid ${bookingType === 'CELEBRATION' ? C.accent : C.s2}50`,
          }}>
          <PartyPopper className="w-3.5 h-3.5" /> Celebration
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6">
        {(['PENDING', 'APPROVED', 'ALL'] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-5 py-2 rounded-full text-xs font-medium tracking-wide uppercase transition-all duration-300"
            style={{
              background: filter === f ? C.accent : `${C.s1}30`,
              color: filter === f ? C.bg : C.s3,
              border: `1px solid ${filter === f ? C.accent : C.s2}50`,
            }}>
            {f === 'ALL' ? 'All' : f === 'PENDING' ? 'Pending' : 'Approved'}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl text-sm mb-6"
          style={{ background: '#7a221f15', color: '#7a221f' }}>
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: C.accent }} />
        </div>
      )}

      {/* Empty */}
      {!isLoading && list.length === 0 && (
        <div className="text-center py-20">
          <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: C.s2 }} />
          <p className="text-sm" style={{ color: C.s3 }}>No bookings found.</p>
        </div>
      )}

      {/* Theater bookings list */}
      {!isLoading && bookingType === 'THEATER' && bookings.length > 0 && (
        <div className="space-y-4">
          <AnimatePresence>
            {bookings.map((b) => (
              <motion.div key={b.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-5" style={{ background: `${C.s1}25`, border: `1px solid ${C.s2}50` }}>
                <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Film className="w-4 h-4" style={{ color: C.accent }} />
                      <h3 className="font-semibold text-sm" style={{ color: C.accent, fontFamily: "'Playfair Display', serif" }}>
                        {b.movie_name}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: C.s3 }}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(b.booking_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {b.number_of_guests} guests
                      </span>
                    </div>
                    {b.special_requests && (
                      <p className="text-xs mt-2 italic" style={{ color: C.s2 }}>
                        "{b.special_requests}"
                      </p>
                    )}
                  </div>
                  <StatusBadge status={b.booking_status} />
                </div>

                <div className="flex items-center justify-between pt-3 flex-wrap gap-3"
                  style={{ borderTop: `1px solid ${C.s2}40` }}>
                  <div className="text-xs" style={{ color: C.s3 }}>
                    Total: <strong style={{ color: C.accent }}>₹{parseFloat(b.total_amount).toFixed(0)}</strong>
                    {' · '}Advance: <strong style={{ color: C.accent }}>₹{parseFloat(b.advance_amount).toFixed(0)}</strong>
                    {' · '}Requested: {new Date(b.created_at).toLocaleDateString('en-IN')}
                  </div>

                  {b.booking_status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleReject(b.id)} disabled={actionId === b.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 disabled:opacity-50"
                        style={{ border: '1px solid #7a221f50', color: '#7a221f', background: '#7a221f10' }}>
                        {actionId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                        Reject
                      </button>
                      <button onClick={() => handleApprove(b.id)} disabled={actionId === b.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 disabled:opacity-50"
                        style={{ background: C.accent, color: C.bg }}>
                        {actionId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Celebration bookings list */}
      {!isLoading && bookingType === 'CELEBRATION' && celebrations.length > 0 && (
        <div className="space-y-4">
          <AnimatePresence>
            {celebrations.map((c) => (
              <motion.div key={c.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-5" style={{ background: `${C.s1}25`, border: `1px solid ${C.s2}50` }}>
                <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Gift className="w-4 h-4" style={{ color: C.accent }} />
                      <h3 className="font-semibold text-sm" style={{ color: C.accent, fontFamily: "'Playfair Display', serif" }}>
                        {c.occasion_name} — {c.package_type}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: C.s3 }}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(c.event_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {c.number_of_guests} guests
                      </span>
                    </div>
                    {c.special_requests && (
                      <p className="text-xs mt-2 italic" style={{ color: C.s2 }}>
                        "{c.special_requests}"
                      </p>
                    )}
                  </div>
                  <StatusBadge status={c.booking_status} />
                </div>

                <div className="flex items-center justify-between pt-3 flex-wrap gap-3"
                  style={{ borderTop: `1px solid ${C.s2}40` }}>
                  <div className="text-xs" style={{ color: C.s3 }}>
                    Total: <strong style={{ color: C.accent }}>₹{parseFloat(c.total_amount).toFixed(0)}</strong>
                    {' · '}Advance: <strong style={{ color: C.accent }}>₹{parseFloat(c.advance_amount).toFixed(0)}</strong>
                    {' · '}Requested: {new Date(c.created_at).toLocaleDateString('en-IN')}
                  </div>

                  {c.booking_status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleReject(c.id)} disabled={actionId === c.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 disabled:opacity-50"
                        style={{ border: '1px solid #7a221f50', color: '#7a221f', background: '#7a221f10' }}>
                        {actionId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                        Reject
                      </button>
                      <button onClick={() => handleApprove(c.id)} disabled={actionId === c.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 disabled:opacity-50"
                        style={{ background: C.accent, color: C.bg }}>
                        {actionId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}