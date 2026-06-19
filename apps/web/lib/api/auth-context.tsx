'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from './client';

const TOKEN_KEY = 'playmorrow_token';
const REFRESH_KEY = 'playmorrow_refresh';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
}

interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (data: { email: string; username: string; displayName: string; password: string }) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate token from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
      api
        .get<AuthUser>('/auth/me', stored)
        .then(setUser)
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_KEY);
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const storeSession = useCallback((newToken: string, refreshToken: string, newUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const login = useCallback(async (emailOrUsername: string, password: string) => {
    const res = await api.post<AuthResult>('/auth/login', { emailOrUsername, password });
    storeSession(res.accessToken, res.refreshToken, res.user);
  }, [storeSession]);

  const register = useCallback(
    async (data: { email: string; username: string; displayName: string; password: string }) => {
      const res = await api.post<AuthResult>('/auth/register', data);
      storeSession(res.accessToken, res.refreshToken, res.user);
    },
    [storeSession],
  );

  const logout = useCallback(() => {
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (refresh) {
      api.post('/auth/logout', { refreshToken: refresh }).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!token) return;
    const u = await api.get<AuthUser>('/auth/me', token);
    setUser(u);
  }, [token]);

  const value: AuthContextValue = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
