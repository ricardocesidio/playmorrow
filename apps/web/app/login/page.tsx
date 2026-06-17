'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Gamepad2, LogIn } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/api/auth-context';
import { ApiError } from '@/lib/api/client';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect
  if (isAuthenticated && !authLoading) {
    router.replace('/dashboard');
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!emailOrUsername.trim() || !password.trim()) {
      setError('All fields are required');
      return;
    }
    setLoading(true);
    try {
      await login(emailOrUsername.trim(), password);
      router.replace('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        const msg = typeof err.body === 'object' && err.body && 'message' in (err.body as object)
          ? (err.body as { message: string }).message
          : 'Invalid credentials';
        setError(msg);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
              <Gamepad2 className="size-5" />
            </span>
            <span className="text-lg">Playmorrow</span>
          </Link>
        </div>

        <h1 className="mb-1 text-center text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Welcome back to Playmorrow.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="emailOrUsername" className="mb-1.5 block text-sm font-medium">
              Email or username
            </label>
            <input
              id="emailOrUsername"
              type="text"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              placeholder="you@example.com"
              autoComplete="username"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in…' : 'Sign in'}
            <LogIn className="size-4" />
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary underline-offset-2 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
