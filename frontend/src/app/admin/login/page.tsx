'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Mail, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AxiosError } from 'axios';

const C = {
  bg: '#E1D4C2',
  s1: '#BEB5A9',
  s2: '#A78D78',
  s3: '#6E473B',
  accent: '#291C0E',
};

interface ApiErrorResponse {
  detail?: string;
}

export default function AdminLoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      // Re-check is_staff after login completes
      setTimeout(() => {
        router.push('/admin');
      }, 100);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(axiosError.response?.data?.detail || 'Invalid credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: C.bg }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div
          className="rounded-2xl p-8 md:p-10"
          style={{
            background: `${C.s1}30`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${C.s2}60`,
          }}
        >
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: `${C.accent}15` }}>
              <ShieldCheck className="w-6 h-6" style={{ color: C.accent }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: C.accent }}>
              Admin Access
            </h1>
            <p className="text-sm mt-1" style={{ color: C.s3 }}>Midnight House Control Panel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: C.s3 }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.accent }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none"
                  style={{ background: `${C.bg}90`, border: `1px solid ${C.s2}80`, color: C.accent }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: C.s3 }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.accent }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none"
                  style={{ background: `${C.bg}90`, border: `1px solid ${C.s2}80`, color: C.accent }}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-xs" style={{ background: '#7a221f15', color: '#7a221f' }}>
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: C.accent, color: C.bg }}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In to Admin'}
            </button>
          </form>
        </div>
      </motion.div>
    </main>
  );
}