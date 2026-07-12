'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, AlertCircle, Plus, Pencil, Trash2,
  X, Check, Tag, Calendar, Percent,
} from 'lucide-react';
import api from '@/lib/api';

const C = {
  bg: '#E1D4C2',
  s1: '#BEB5A9',
  s2: '#A78D78',
  s3: '#6E473B',
  accent: '#291C0E',
};

interface Offer {
  id: number;
  title: string;
  description: string;
  applies_to: 'DINE_IN' | 'THEATER';
  discount_percentage: number;
  coupon_code: string;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

interface FormState {
  title: string;
  description: string;
  applies_to: 'DINE_IN' | 'THEATER';
  discount_percentage: string;
  coupon_code: string;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  applies_to: 'DINE_IN',
  discount_percentage: '',
  coupon_code: '',
  valid_from: '',
  valid_until: '',
  is_active: true,
};

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function isExpired(dateStr: string) {
  return new Date(dateStr) < new Date();
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formError, setFormError] = useState('');

  const fetchOffers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get<Offer[]>('/offers/');
      setOffers(res.data);
    } catch {
      setError('Could not load offers.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const openAddForm = () => {
    setEditingOffer(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (offer: Offer) => {
    setEditingOffer(offer);
    setForm({
      title: offer.title,
      description: offer.description,
      applies_to: offer.applies_to,
      discount_percentage: String(offer.discount_percentage),
      coupon_code: offer.coupon_code,
      valid_from: offer.valid_from?.slice(0, 16) ?? '',
      valid_until: offer.valid_until?.slice(0, 16) ?? '',
      is_active: offer.is_active,
    });
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingOffer(null);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const handleSubmit = async () => {
    setFormError('');

    if (!form.title.trim()) return setFormError('Title required.');
    if (!form.coupon_code.trim()) return setFormError('Coupon code required.');
    if (!form.discount_percentage || Number(form.discount_percentage) < 1 || Number(form.discount_percentage) > 100)
      return setFormError('Discount must be between 1 and 100.');
    if (!form.valid_from || !form.valid_until) return setFormError('Both dates are required.');
    if (new Date(form.valid_from) >= new Date(form.valid_until))
      return setFormError('Valid until must be after valid from.');

    setIsSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        applies_to: form.applies_to,
        discount_percentage: Number(form.discount_percentage),
        coupon_code: form.coupon_code.trim().toUpperCase(),
        valid_from: form.valid_from,
        valid_until: form.valid_until,
        is_active: form.is_active,
      };

      if (editingOffer) {
        await api.patch(`/offers/${editingOffer.id}/`, payload);
      } else {
        await api.post('/offers/', payload);
      }

      closeForm();
      fetchOffers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      const data = e?.response?.data;
      if (data?.coupon_code) {
        setFormError('Coupon code already exists. Use a different one.');
      } else {
        setFormError('Could not save offer. Please try again.');
      }
      console.error(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this offer? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/offers/${id}/`);
      fetchOffers();
    } catch {
      setError('Could not delete offer.');
    } finally {
      setDeletingId(null);
    }
  };

  const activeOffers = offers.filter(o => o.is_active && !isExpired(o.valid_until));
  const inactiveOffers = offers.filter(o => !o.is_active || isExpired(o.valid_until));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: C.s3 }}>Admin</p>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: C.accent }}>
            Offers & Coupons
          </h1>
        </div>
        <button onClick={openAddForm}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300"
          style={{ background: C.accent, color: C.bg }}>
          <Plus className="w-4 h-4" /> New Offer
        </button>
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

      {/* Offers List */}
      {!isLoading && (
        <div className="space-y-8">
          {/* Active */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: C.s3 }}>
              Active ({activeOffers.length})
            </p>
            {activeOffers.length === 0 ? (
              <div className="rounded-2xl p-8 text-center text-sm" style={{ background: `${C.s1}25`, color: C.s3 }}>
                No active offers right now.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeOffers.map(offer => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    onEdit={() => openEditForm(offer)}
                    onDelete={() => handleDelete(offer.id)}
                    isDeleting={deletingId === offer.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Inactive / Expired */}
          {inactiveOffers.length > 0 && (
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: C.s3 }}>
                Inactive / Expired ({inactiveOffers.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inactiveOffers.map(offer => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    onEdit={() => openEditForm(offer)}
                    onDelete={() => handleDelete(offer.id)}
                    isDeleting={deletingId === offer.id}
                    dimmed
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.4)' }}
              onClick={closeForm} />

            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="fixed inset-4 z-50 rounded-2xl overflow-y-auto"
              style={{ background: C.bg, border: `1px solid ${C.s2}50` }}>

              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: C.accent }}>
                    {editingOffer ? 'Edit Offer' : 'New Offer'}
                  </h2>
                  <button onClick={closeForm} className="p-2 rounded-full"
                    style={{ background: `${C.s1}50`, color: C.accent }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {formError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl text-xs mb-4"
                    style={{ background: '#7a221f15', color: '#7a221f' }}>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {formError}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: C.s3 }}>Title *</label>
                    <input type="text" value={form.title}
                      onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                      style={{ background: `${C.s1}30`, border: `1px solid ${C.s2}80`, color: C.accent }}
                      placeholder="e.g. Weekend Special" />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: C.s3 }}>Description</label>
                    <textarea value={form.description} rows={2}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                      style={{ background: `${C.s1}30`, border: `1px solid ${C.s2}80`, color: C.accent }}
                      placeholder="Short description shown to users..." />
                  </div>

                  {/* Applies To + Discount */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: C.s3 }}>Applies To *</label>
                      <select value={form.applies_to}
                        onChange={e => setForm(p => ({ ...p, applies_to: e.target.value as 'DINE_IN' | 'THEATER' }))}
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                        style={{ background: `${C.s1}30`, border: `1px solid ${C.s2}80`, color: C.accent }}>
                        <option value="DINE_IN">Dine In</option>
                        <option value="THEATER">Theater</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: C.s3 }}>Discount % *</label>
                      <input type="number" min={1} max={100} value={form.discount_percentage}
                        onChange={e => setForm(p => ({ ...p, discount_percentage: e.target.value }))}
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                        style={{ background: `${C.s1}30`, border: `1px solid ${C.s2}80`, color: C.accent }}
                        placeholder="10" />
                    </div>
                  </div>

                  {/* Coupon Code */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: C.s3 }}>Coupon Code *</label>
                    <input type="text" value={form.coupon_code}
                      onChange={e => setForm(p => ({ ...p, coupon_code: e.target.value.toUpperCase() }))}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none font-mono tracking-widest"
                      style={{ background: `${C.s1}30`, border: `1px solid ${C.s2}80`, color: C.accent }}
                      placeholder="MIDNIGHT20" />
                    <p className="text-[10px] mt-1" style={{ color: C.s2 }}>Auto uppercase. Must be unique.</p>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: C.s3 }}>Valid From *</label>
                      <input type="date" value={form.valid_from}
                        onChange={e => setForm(p => ({ ...p, valid_from: e.target.value }))}
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                        style={{ background: `${C.s1}30`, border: `1px solid ${C.s2}80`, color: C.accent }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: C.s3 }}>Valid Until *</label>
                      <input type="date" value={form.valid_until}
                        onChange={e => setForm(p => ({ ...p, valid_until: e.target.value }))}
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                        style={{ background: `${C.s1}30`, border: `1px solid ${C.s2}80`, color: C.accent }} />
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                      className="relative w-10 h-5 rounded-full transition-all duration-300 cursor-pointer"
                      style={{ background: form.is_active ? C.accent : C.s1 }}>
                      <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300"
                        style={{ background: C.bg, left: form.is_active ? '22px' : '2px' }} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: C.s3 }}>
                      {form.is_active ? 'Active — users can see this offer' : 'Inactive — hidden from users'}
                    </span>
                  </label>

                  {/* Submit */}
                  <button onClick={handleSubmit} disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold transition-all duration-300 disabled:opacity-60"
                    style={{ background: C.accent, color: C.bg }}>
                    {isSubmitting
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Check className="w-4 h-4" />}
                    {editingOffer ? 'Save Changes' : 'Create Offer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Offer Card ──────────────────────────────────────────────
function OfferCard({
  offer, onEdit, onDelete, isDeleting, dimmed = false
}: {
  offer: Offer;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  dimmed?: boolean;
}) {
  const expired = isExpired(offer.valid_until);

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: dimmed ? 0.5 : 1, y: 0 }}
      className="rounded-2xl p-5"
      style={{ background: `${C.s1}25`, border: `1px solid ${C.s2}50` }}>

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-sm mb-0.5"
            style={{ fontFamily: "'Playfair Display', serif", color: C.accent }}>
            {offer.title}
          </h3>
          {offer.description && (
            <p className="text-xs line-clamp-2" style={{ color: C.s3 }}>{offer.description}</p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ background: C.accent, color: C.bg }}>
          <Percent className="w-3 h-3" />
          {offer.discount_percentage}% OFF
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Tag className="w-3.5 h-3.5 shrink-0" style={{ color: C.s2 }} />
        <span className="font-mono text-xs font-bold tracking-widest px-2 py-0.5 rounded-lg"
          style={{ background: `${C.s2}25`, color: C.accent }}>
          {offer.coupon_code}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full"
          style={{
            background: offer.applies_to === 'DINE_IN' ? '#2d5a2d15' : '#1a2d5a15',
            color: offer.applies_to === 'DINE_IN' ? '#2d5a2d' : '#1a2d5a',
          }}>
          {offer.applies_to === 'DINE_IN' ? 'Dine In' : 'Theater'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 mb-4 text-[11px]" style={{ color: C.s3 }}>
        <Calendar className="w-3 h-3 shrink-0" />
        <span>{formatDate(offer.valid_from)} → {formatDate(offer.valid_until)}</span>
        {expired && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px]"
            style={{ background: '#7a221f15', color: '#7a221f' }}>
            Expired
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] px-2 py-0.5 rounded-full"
          style={{
            background: offer.is_active && !expired ? '#2d5a2d15' : '#7a221f15',
            color: offer.is_active && !expired ? '#2d5a2d' : '#7a221f',
          }}>
          {offer.is_active && !expired ? 'Active' : expired ? 'Expired' : 'Inactive'}
        </span>

        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="p-2 rounded-full transition-all"
            style={{ background: `${C.s1}50`, color: C.accent }}>
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} disabled={isDeleting}
            className="p-2 rounded-full transition-all"
            style={{ background: '#7a221f15', color: '#7a221f' }}>
            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}