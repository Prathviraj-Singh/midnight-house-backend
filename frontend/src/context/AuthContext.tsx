'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  is_staff: boolean;
  is_student_verified: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_CACHE_KEY = 'mh_user_cache';

function getCachedUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function setCachedUser(user: User | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_CACHE_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verifySession = async () => {
      const cached = getCachedUser();
      if (cached) {
        setUser(cached);
        setIsLoading(false);
      }
      try {
        const response = await api.get<User | { user: User }>('/auth/me/');
        const userData =
          'user' in (response.data as object)
            ? (response.data as { user: User }).user
            : (response.data as User);
        setUser(userData);
        setCachedUser(userData);
      } catch {
        // Cookie expired or invalid — clear cache and user
        setUser(null);
        setCachedUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<{ user: User }>('/auth/login/', { email, password });
    setUser(response.data.user);
    setCachedUser(response.data.user);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const response = await api.post<{ user: User }>('/auth/register/', data);
    setUser(response.data.user);
    setCachedUser(response.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout/');
    } finally {
      setUser(null);
      setCachedUser(null);
      router.push('/login');
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}