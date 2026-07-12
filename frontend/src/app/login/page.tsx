'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AxiosError } from 'axios';

// ─── Palette (60-30-10) — must match landing page exactly ────────────────────
const C = {
  bg: '#E1D4C2',
  s1: '#BEB5A9',
  s2: '#A78D78',
  s3: '#6E473B',
  accent: '#291C0E',
};

interface ApiErrorResponse {
  detail?: string;
  non_field_errors?: string[];
  [key: string]: unknown;
}

export default function LoginPage() {
  const { login } = useAuth();
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
      router.push('/');
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const data = axiosError.response?.data;

      if (data?.detail) {
        setError(data.detail);
      } else if (data?.non_field_errors?.[0]) {
        setError(data.non_field_errors[0]);
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: C.bg }}>
      {/* Ambient accent glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: `radial-gradient(circle, ${C.s2}20 0%, transparent 70%)` }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        <div
          className="rounded-2xl p-8 md:p-10"
          style={{
            background: `${C.s1}30`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${C.s2}60`,
            boxShadow: `0 8px 32px ${C.accent}15`,
          }}
        >
          {/* Logo / Brand */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold mb-1"
              style={{ fontFamily: "'Playfair Display', serif", color: C.accent }}
            >
              Midnight House
            </h1>
            <p className="text-sm" style={{ color: C.s3 }}>
              Your Own Private Space
            </p>
            <div className="mt-4 h-px w-16 mx-auto" style={{ background: `linear-gradient(90deg, transparent, ${C.accent}50, transparent)` }} />
          </div>

          <p className="text-center text-sm mb-6" style={{ color: C.s3 }}>Sign in to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium mb-1.5" style={{ color: C.s3 }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.accent }} />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all duration-200"
                  style={{
                    background: `${C.bg}90`,
                    border: `1px solid ${C.s2}80`,
                    color: C.accent,
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = `${C.s2}80`)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-xs font-medium mb-1.5" style={{ color: C.s3 }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.accent }} />
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all duration-200"
                  style={{
                    background: `${C.bg}90`,
                    border: `1px solid ${C.s2}80`,
                    color: C.accent,
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = `${C.s2}80`)}
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
                style={{ background: '#7a221f15', border: '1px solid #7a221f40', color: '#7a221f' }}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Submit button */}
            <button
              id="login-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full py-3 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: C.accent,
                color: C.bg,
                boxShadow: isSubmitting ? 'none' : `0 4px 20px ${C.accent}30`,
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="mt-6 text-center text-sm" style={{ color: C.s3 }}>
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-medium transition-colors duration-200"
              style={{ color: C.accent }}
            >
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
