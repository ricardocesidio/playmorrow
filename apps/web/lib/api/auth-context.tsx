'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, ApiError, type RegisterResponse } from './client';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  role: string;
  accountType: 'PLAYER' | 'STUDIO';
  isOnboardingCompleted?: boolean;
  emailChangeCount?: number;
  level?: number;
  xp?: number;
}

export interface RegisterResult {
  requiresEmailVerification: boolean;
  email: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    accountType: string;
  };
}

export class EmailNotVerifiedError extends Error {
  email: string;
  constructor(email: string) {
    super('Please verify your email before signing in.');
    this.name = 'EmailNotVerifiedError';
    this.email = email;
  }
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (emailOrUsername: string, password: string) => Promise<AuthUser>;
  register: (data: {
    email: string;
    username: string;
    displayName: string;
    password: string;
    accountType?: 'PLAYER' | 'STUDIO';
    acceptedTerms: boolean;
    marketingOptIn?: boolean;
    partnerMarketingOptIn?: boolean;
  }) => Promise<RegisterResult>;
  verifyEmail: (email: string, code: string) => Promise<AuthUser>;
  resendVerificationCode: (email: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const u = await api.get<AuthUser>('/auth/session/me');
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hydrate session on mount
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(async (emailOrUsername: string, password: string) => {
    try {
      const u = await api.post<AuthUser>('/auth/session/login', { emailOrUsername, password });
      setUser(u);
      return u;
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as Record<string, unknown> | undefined;
        if (body?.code === 'EMAIL_NOT_VERIFIED' && typeof body?.email === 'string') {
          throw new EmailNotVerifiedError(body.email);
        }
      }
      throw err;
    }
  }, []);

  const register = useCallback(async (data: {
    email: string;
    username: string;
    displayName: string;
    password: string;
    accountType?: 'PLAYER' | 'STUDIO';
    acceptedTerms: boolean;
    marketingOptIn?: boolean;
    partnerMarketingOptIn?: boolean;
  }) => {
    const result = await api.post<RegisterResponse>('/auth/register', data);
    return {
      requiresEmailVerification: result.requiresEmailVerification,
      email: result.email,
      user: {
        id: result.user.id,
        username: result.user.username,
        displayName: result.user.displayName,
        accountType: result.user.accountType,
      },
    };
  }, []);

  const verifyEmail = useCallback(async (email: string, code: string) => {
    const result = await api.post<{ user: AuthUser; accessToken: string }>('/auth/verify-email', { email, code });
    setUser(result.user);
    return result.user;
  }, []);

  const resendVerificationCode = useCallback(async (email: string) => {
    await api.post('/auth/resend-verification', { email });
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/session/logout'); } catch { /* ignore */ }
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    token: null,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    verifyEmail,
    resendVerificationCode,
    logout,
    refreshMe: fetchMe,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
