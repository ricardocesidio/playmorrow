'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? String((err.body as Record<string, unknown>)?.message ?? '') || 'Request failed' : 'Something went wrong');
    } finally { setLoading(false); }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm border border-border bg-elevated p-8 text-center">
          <h1 className="mb-2 font-display text-2xl font-semibold">Check your email</h1>
          <p className="text-sm text-muted-foreground">If an account exists with that email, a reset link has been sent.</p>
          <Link href="/login" className="mt-6 inline-block font-mono text-xs uppercase tracking-widest text-cyan underline">Back to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Link href="/" className="mb-8 flex items-center gap-2 font-display text-lg font-semibold">
        <span className="grid size-8 place-items-center bg-cyan/10 text-cyan"><Gamepad2 className="size-4" /></span>
        <span>Playmorrow</span>
      </Link>
      <div className="w-full max-w-sm border border-border bg-elevated p-8">
        <h1 className="mb-1 font-display text-2xl font-semibold tracking-tight">Reset password</h1>
        <p className="mb-6 font-mono text-xs uppercase tracking-widest text-muted-foreground">Enter your email</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block font-mono text-xs uppercase tracking-widest text-muted-foreground">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-input bg-background px-3 py-2 font-mono text-sm focus:border-cyan focus:outline-none" autoComplete="email" />
          </div>
          {error && <p className="font-mono text-xs uppercase tracking-widest text-coral">{error}</p>}
          <button type="submit" disabled={loading} className="w-full border border-coral bg-coral/10 py-2.5 font-mono text-xs uppercase tracking-widest text-coral transition-colors hover:bg-coral hover:text-coral-foreground disabled:opacity-50">
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link href="/login" className="font-mono text-xs uppercase tracking-widest text-cyan">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
