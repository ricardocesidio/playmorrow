'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';

import { useAuth } from '@/lib/api/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) router.replace('/dashboard');
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-6 animate-spin border border-cyan border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError('All fields required'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Link href="/" className="mb-8 flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
        <span className="grid size-8 place-items-center bg-cyan/10 text-cyan">
          <Gamepad2 className="size-4" />
        </span>
        <span>Playmorrow</span>
      </Link>

      <div className="w-full max-w-sm border border-border bg-elevated p-8">
        <h1 className="mb-1 font-display text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mb-6 font-mono text-xs uppercase tracking-widest text-muted-foreground">Welcome back</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block font-mono text-xs uppercase tracking-widest text-muted-foreground">Email or username</label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-input bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-cyan focus:outline-none"
              placeholder="user@example.com"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block font-mono text-xs uppercase tracking-widest text-muted-foreground">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-input bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-cyan focus:outline-none"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="font-mono text-xs uppercase tracking-widest text-coral">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full border border-coral bg-coral/10 py-2.5 font-mono text-xs uppercase tracking-widest text-coral transition-colors hover:bg-coral hover:text-coral-foreground disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/register" className="font-mono text-xs uppercase tracking-widest text-cyan transition-colors hover:text-cyan/80">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
