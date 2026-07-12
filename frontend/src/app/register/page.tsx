'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AxiosError } from 'axios';

// ─── Palette (60-30-10) — must match landing + login pages exactly ───────────
const C = {
  bg: '#E1D4C2',
  s1: '#BEB5A9',
  s2: '#A78D78',
  s3: '#6E473B',
  accent: '#291C0E',
};

interface RegisterFields {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
  password2: string;
}

interface ApiErrorResponse {
  detail?: string;
  non_field_errors?: string[];
  email?: string[];
  phone_number?: string[];
  password?: string[];
  [key: string]: unknown;
}

const INITIAL_FIELDS: RegisterFields = {
  first_name: '',
  last_name: '',
  email: '',
  phone_number: '',
  password: '',
  password2: '',
};

interface FieldProps {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  autoComplete?: string;
  icon: React.ReactNode;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

function Field({ id, label, type, placeholder, value, autoComplete, icon, onChange }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium mb-1.5" style={{ color: C.s3 }}>
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.accent }}>
          {icon}
        </span>
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all duration-200"
          style={{
            background: `${C.bg}90`,
            border: `1px solid ${focused ? C.accent : `${C.s2}80`}`,
            color: C.accent,
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [fields, setFields] = useState<RegisterFields>(INITIAL_FIELDS);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key: keyof RegisterFields) => (e: ChangeEvent<HTMLInputElement>) =>
    setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = (): string | null => {
    if (fields.password !== fields.password2) {
      return "Passwords don't match.";
    }
    if (!/^\d{10}$/.test(fields.phone_number)) {
      return 'Phone number must be exactly 10 digits.';
    }
    if (fields.password.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      await register(fields);
      router.push('/');
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const data = axiosError.response?.data;

      if (data?.detail) {
        setError(data.detail);
      } else if (data?.non_field_errors?.[0]) {
        setError(data.non_field_errors[0]);
      } else if (data?.email?.[0]) {
        setError(`Email: ${data.email[0]}`);
      } else if (data?.phone_number?.[0]) {
        setError(`Phone: ${data.phone_number[0]}`);
      } else if (data?.password?.[0]) {
        setError(`Password: ${data.password[0]}`);
      } else {
        setError('Registration failed. Please check your details and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: C.bg }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full"
          style={{ background: `radial-gradient(circle, ${C.s2}20 0%, transparent 70%)` }}
        />
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
          {/* Brand header */}
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
            <div
              className="mt-4 h-px w-16 mx-auto"
              style={{ background: `linear-gradient(90deg, transparent, ${C.accent}50, transparent)` }}
            />
          </div>

          <p className="text-center text-sm mb-6" style={{ color: C.s3 }}>Create your account</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <Field
                id="reg-first-name"
                label="First Name"
                type="text"
                placeholder="Arjun"
                value={fields.first_name}
                autoComplete="given-name"
                icon={<User className="w-4 h-4" />}
                onChange={update('first_name')}
              />
              <Field
                id="reg-last-name"
                label="Last Name"
                type="text"
                placeholder="Sharma"
                value={fields.last_name}
                autoComplete="family-name"
                icon={<User className="w-4 h-4" />}
                onChange={update('last_name')}
              />
            </div>

            <Field
              id="reg-email"
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={fields.email}
              autoComplete="email"
              icon={<Mail className="w-4 h-4" />}
              onChange={update('email')}
            />

            <Field
              id="reg-phone"
              label="Phone Number"
              type="tel"
              placeholder="9876543210"
              value={fields.phone_number}
              autoComplete="tel"
              icon={<Phone className="w-4 h-4" />}
              onChange={update('phone_number')}
            />

            <Field
              id="reg-password"
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              value={fields.password}
              autoComplete="new-password"
              icon={<Lock className="w-4 h-4" />}
              onChange={update('password')}
            />

            <Field
              id="reg-password2"
              label="Confirm Password"
              type="password"
              placeholder="Repeat your password"
              value={fields.password2}
              autoComplete="new-password"
              icon={<Lock className="w-4 h-4" />}
              onChange={update('password2')}
            />

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
                style={{
                  background: '#7a221f15',
                  border: '1px solid #7a221f40',
                  color: '#7a221f',
                }}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              id="register-submit"
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
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: C.s3 }}>
            Already have an account?{' '}
            <Link href="/login" className="font-medium transition-colors duration-200" style={{ color: C.accent }}>
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
