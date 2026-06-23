'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Gamepad2, Building2 } from 'lucide-react';

import { useAuth } from '@/lib/api/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState<'type' | 'form'>('type');
  const [accountType, setAccountType] = useState<'PLAYER' | 'STUDIO' | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) router.replace('/dashboard');
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><div className="size-6 animate-spin border border-cyan border-t-transparent" /></div>;
  }

  if (isAuthenticated) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!displayName.trim()) errs.displayName = 'Name is required';
    if (!username.trim()) errs.username = 'Username is required';
    else if (!/^[a-zA-Z0-9]+$/.test(username)) errs.username = 'Username can only contain letters and numbers';
    else if (username.length > 12) errs.username = 'Username must be at most 12 characters';
    else if (username.length < 3) errs.username = 'Username must be at least 3 characters';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!email.includes('@')) errs.email = 'Enter a valid email address';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    else if (!/[^a-zA-Z0-9]/.test(password)) errs.password = 'Password must include at least one special character';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const result = await register({
        email: email.trim(),
        username: username.trim(),
        displayName: displayName.trim(),
        password,
        accountType: accountType ?? 'PLAYER',
      });
      if (result.accountType === 'STUDIO') {
        router.push('/studios/new?from=register');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setErrors({ form: err instanceof Error ? err.message : 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'type') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-lg">
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl font-semibold tracking-tight">Join Playmorrow</h1>
            <p className="mt-2 text-sm text-muted-foreground">Choose how you want to start.</p>
          </div>
          <div className="grid gap-4">
            <button
              type="button"
              onClick={() => { setAccountType('PLAYER'); setStep('form'); }}
              className="group flex items-start gap-5 border border-border bg-elevated p-6 text-left transition-colors hover:border-cyan/50"
            >
              <span className="grid size-12 shrink-0 place-items-center border border-border bg-background/60 text-cyan">
                <Gamepad2 className="size-5" />
              </span>
              <div>
                <p className="font-display text-lg font-semibold">Player</p>
                <p className="mt-1 text-sm text-muted-foreground">Discover games, follow updates, comment, and save games to your wishlist.</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => { setAccountType('STUDIO'); setStep('form'); }}
              className="group flex items-start gap-5 border border-border bg-elevated p-6 text-left transition-colors hover:border-coral/50"
            >
              <span className="grid size-12 shrink-0 place-items-center border border-border bg-background/60 text-coral">
                <Building2 className="size-5" />
              </span>
              <div>
                <p className="font-display text-lg font-semibold">Indie Studio / Company</p>
                <p className="mt-1 text-sm text-muted-foreground">Share your game, create a studio profile, publish devlogs, and grow your community.</p>
              </div>
            </button>
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-cyan underline">Sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <button type="button" onClick={() => setStep('type')} className="mb-6 font-mono text-xs uppercase tracking-widest text-muted-foreground underline">
        &larr; Back
      </button>
      <div className="w-full max-w-sm border border-border bg-elevated p-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {accountType === 'STUDIO' ? <Building2 className="size-3 text-coral" /> : <Gamepad2 className="size-3 text-cyan" />}
          {accountType === 'STUDIO' ? 'Indie Studio / Company' : 'Player'}
        </div>
        <h1 className="mb-6 font-display text-2xl font-semibold tracking-tight">Create account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="mb-1 block font-mono text-xs uppercase tracking-widest text-muted-foreground">Name</label>
            <input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full border border-input bg-background px-3 py-2 font-mono text-sm focus:border-cyan focus:outline-none"
              placeholder="Your name" autoComplete="name" />
            {errors.displayName && <p className="mt-1 font-mono text-[10px] text-coral">{errors.displayName}</p>}
          </div>

          <div>
            <label htmlFor="username" className="mb-1 block font-mono text-xs uppercase tracking-widest text-muted-foreground">Username</label>
            <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-input bg-background px-3 py-2 font-mono text-sm focus:border-cyan focus:outline-none"
              placeholder="yourname" autoComplete="username" maxLength={12} />
            {errors.username && <p className="mt-1 font-mono text-[10px] text-coral">{errors.username}</p>}
            <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">Letters and numbers only. Max 12 characters.</p>
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block font-mono text-xs uppercase tracking-widest text-muted-foreground">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-input bg-background px-3 py-2 font-mono text-sm focus:border-cyan focus:outline-none"
              placeholder="you@example.com" autoComplete="email" />
            {errors.email && <p className="mt-1 font-mono text-[10px] text-coral">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block font-mono text-xs uppercase tracking-widest text-muted-foreground">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-input bg-background px-3 py-2 font-mono text-sm focus:border-cyan focus:outline-none"
              placeholder="••••••••" autoComplete="new-password" />
            {errors.password && <p className="mt-1 font-mono text-[10px] text-coral">{errors.password}</p>}
            <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">Use at least 8 characters and one special character.</p>
          </div>

          {errors.form && <p className="font-mono text-xs uppercase tracking-widest text-coral">{errors.form}</p>}

          <button type="submit" disabled={loading}
            className="w-full border border-coral bg-coral/10 py-2.5 font-mono text-xs uppercase tracking-widest text-coral transition-colors hover:bg-coral hover:text-coral-foreground disabled:opacity-50">
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-cyan underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
