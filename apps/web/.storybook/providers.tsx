import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { MOCK_USER, MOCK_TOKEN } from '@/lib/api/mock-data';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const mockAuthValue = {
  user: MOCK_USER,
  token: MOCK_TOKEN,
  isLoading: false,
  isAuthenticated: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshMe: async () => {},
};

const mockAuthValueLoggedOut = {
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshMe: async () => {},
};

export function createAuthProvider(authValue: typeof mockAuthValue) {
  return function AuthProvider({ children }: { children: ReactNode }) {
    const AuthContext = require('@/lib/api/auth-context');
    const Ctx = AuthContext.default
      ? AuthContext.default
      : Object.values(AuthContext).find((v: unknown) => typeof v === 'object' && v !== null && 'Provider' in v);

    if (Ctx?.Provider) {
      return <Ctx.Provider value={authValue}>{children}</Ctx.Provider>;
    }
    return <>{children}</>;
  };
}

export function withProviders(Story: () => ReactNode, authValue?: typeof mockAuthValue) {
  const AuthProvider = createAuthProvider(authValue ?? mockAuthValue);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{Story()}</AuthProvider>
    </QueryClientProvider>
  );
}
