'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, AlertCircle, Plus, X, Check,
  Users, ShieldCheck, ShieldOff,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const C = {
  bg: '#E1D4C2',
  s1: '#BEB5A9',
  s2: '#A78D78',
  s3: '#6E473B',
  accent: '#291C0E',
};

interface StaffUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  is_staff: boolean;
}

interface FormState {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

const EMPTY_FORM: FormState = {
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  phone_number: '',
};

export default function AdminStaffPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get<StaffUser[]>('/auth/admin/users/');
      setUsers(res.data);
    } catch {
      setError('Could not load users.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openForm = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!form.email.trim()) return setFormError('Email required.');
    if (!form.password.trim() || form.password.length < 6)
      return setFormError('Password must be at least 6 characters.');
    if (!form.first_name.trim()) return setFormError('First name required.');

    setIsSubmitting(true);
    try {
      await api.post('/auth/admin/create-staff/', {
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone_number: form.phone_number.trim(),
      });
      closeForm();
      fetchUsers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      const data = e?.response?.data;
      if (data?.email) {
        setFormError('Email already exists.');
      } else {
        setFormError('Could not create staff. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStaff = async (u: StaffUser) => {
    if (u.id === user?.id) return; // apna account toggle nahi kar sakte
    setTogglingId(u.id);
    try {
      await api.patch(`/auth/admin/users/${u.id}/toggle-staff/`);
      fetchUsers();
    } catch {
      setError('Could not update staff status.');
    } finally {
      setTogglingId(null);
    }
  };

  const staffUsers = users.filter(u => u.is_staff);
  const regularUsers = users.filter(u => !u.is_staff);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: C.s3 }}>Admin</p>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: C.accent }}>
            Staff Management
          </h1>
        </div>
        <button onClick={openForm}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300"
          style={{ background: C.accent, color: C.bg }}>
          <Plus className="w-4 h-4" /> Add Staff
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

      {!isLoading && (
        <div className="space-y-8">

          {/* Staff Members */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: C.s3 }}>
              Staff Members ({staffUsers.length})
            </p>
            {staffUsers.length === 0 ? (
              <div className="rounded-2xl p-8 text-center text-sm" style={{ background: `${C.s1}25`, color: C.s3 }}>
                No staff members yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {staffUsers.map(u => (
                  <UserCard
                    key={u.id}
                    user={u}
                    isSelf={u.id === user?.id}
                    isToggling={togglingId === u.id}
                    onToggle={() => handleToggleStaff(u)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Regular Users */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: C.s3 }}>
              All Users ({regularUsers.length})
            </p>
            {regularUsers.length === 0 ? (
              <div className="rounded-2xl p-8 text-center text-sm" style={{ background: `${C.s1}25`, color: C.s3 }}>
                No regular users yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {regularUsers.map(u => (
                  <UserCard
                    key={u.id}
                    user={u}
                    isSelf={false}
                    isToggling={togglingId === u.id}
                    onToggle={() => handleToggleStaff(u)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
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
                  <h2 className="text-lg font-bold"
                    style={{ fontFamily: "'Playfair Display', serif", color: C.accent }}>
                    Add Staff Member
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
                  {/* Name row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: C.s3 }}>
                        First Name *
                      </label>
                      <input type="text" value={form.first_name}
                        onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))}
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                        style={{ background: `${C.s1}30`, border: `1px solid ${C.s2}80`, color: C.accent }}
                        placeholder="Rahul" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: C.s3 }}>
                        Last Name
                      </label>
                      <input type="text" value={form.last_name}
                        onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))}
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                        style={{ background: `${C.s1}30`, border: `1px solid ${C.s2}80`, color: C.accent }}
                        placeholder="Sharma" />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: C.s3 }}>Email *</label>
                    <input type="email" value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                      style={{ background: `${C.s1}30`, border: `1px solid ${C.s2}80`, color: C.accent }}
                      placeholder="rahul@midnighthouse.in" />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: C.s3 }}>
                      Phone Number
                    </label>
                    <input type="tel" value={form.phone_number}
                      onChange={e => setForm(p => ({ ...p, phone_number: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                      style={{ background: `${C.s1}30`, border: `1px solid ${C.s2}80`, color: C.accent }}
                      placeholder="9876543210" />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: C.s3 }}>Password *</label>
                    <input type="password" value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                      style={{ background: `${C.s1}30`, border: `1px solid ${C.s2}80`, color: C.accent }}
                      placeholder="Min. 6 characters" />
                  </div>

                  {/* Submit */}
                  <button onClick={handleSubmit} disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold transition-all duration-300 disabled:opacity-60"
                    style={{ background: C.accent, color: C.bg }}>
                    {isSubmitting
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Check className="w-4 h-4" />}
                    Create Staff Account
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

// ── User Card ─────────────────────────────────────────────────────────────────
function UserCard({
  user, isSelf, isToggling, onToggle
}: {
  user: StaffUser;
  isSelf: boolean;
  isToggling: boolean;
  onToggle: () => void;
}) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'No Name';
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 rounded-2xl"
      style={{ background: `${C.s1}25`, border: `1px solid ${C.s2}50` }}>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
        style={{ background: C.accent, color: C.bg }}>
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate"
            style={{ color: C.accent, fontFamily: "'Playfair Display', serif" }}>
            {fullName}
          </p>
          {isSelf && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0"
              style={{ background: `${C.s2}30`, color: C.s3 }}>
              You
            </span>
          )}
          {user.is_staff && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0"
              style={{ background: '#2d5a2d15', color: '#2d5a2d' }}>
              Staff
            </span>
          )}
        </div>
        <p className="text-xs truncate mt-0.5" style={{ color: C.s3 }}>{user.email}</p>
        {user.phone_number && (
          <p className="text-xs mt-0.5" style={{ color: C.s2 }}>{user.phone_number}</p>
        )}
      </div>

      {/* Toggle button */}
      {!isSelf && (
        <button onClick={onToggle} disabled={isToggling}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all"
          style={{
            background: user.is_staff ? '#7a221f15' : '#2d5a2d15',
            color: user.is_staff ? '#7a221f' : '#2d5a2d',
          }}>
          {isToggling
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : user.is_staff
              ? <><ShieldOff className="w-3.5 h-3.5" /> Remove</>
              : <><ShieldCheck className="w-3.5 h-3.5" /> Make Staff</>}
        </button>
      )}
    </motion.div>
  );
}