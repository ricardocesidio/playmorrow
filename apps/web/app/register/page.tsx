'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Gamepad2, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/api/auth-context';
import { ApiError } from '@/lib/api/client';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && !authLoading) {
    router.replace('/dashboard');
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!displayName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register({ email: email.trim(), username: username.trim(), displayName: displayName.trim(), password });
      router.replace('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        const msg =
          typeof err.body === 'object' && err.body && 'message' in (err.body as object)
            ? (err.body as { message: string }).message
            : Array.isArray((err.body as { message?: string[] })?.message)
              ? (err.body as { message: string[] }).message.join(', ')
              : 'Registration failed';
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
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
              <Gamepad2 className="size-5" />
            </span>
            <span className="text-lg">Playmorrow</span>
          </Link>
        </div>

        <h1 className="mb-1 text-center text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Join Playmorrow and discover indie games.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="displayName" className="mb-1.5 block text-sm font-medium">
              Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="yourname"
              autoComplete="username"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
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
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating account…' : 'Create account'}
            <UserPlus className="size-4" />
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary underline-offset-2 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
