'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from './client';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
  accountType: 'PLAYER' | 'STUDIO';
}

  interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (emailOrUsername: string, password: string) => Promise<AuthUser>;
  register: (data: { email: string; username: string; displayName: string; password: string; accountType?: 'PLAYER' | 'STUDIO' }) => Promise<{ id: string; username: string; displayName: string; role: string; accountType: string }>;
  logout: () => void;
  refreshMe: () => Promise<void>;
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
    const u = await api.post<AuthUser>('/auth/session/login', { emailOrUsername, password });
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (data: { email: string; username: string; displayName: string; password: string; accountType?: 'PLAYER' | 'STUDIO' }) => {
    const result = await api.post<{ id: string; username: string; displayName: string; role: string; accountType: string }>('/auth/register', data);
    await fetchMe();
    return result;
  }, [fetchMe]);

  const logout = useCallback(async () => {
    try { await api.post('/auth/session/logout'); } catch { /* ignore */ }
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    token: null, // httpOnly cookie; no client-accessible token
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshMe: fetchMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
