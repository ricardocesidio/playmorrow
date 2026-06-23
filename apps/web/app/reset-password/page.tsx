'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { api, ApiError } from '@/lib/api/client';

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!token) setError('Missing reset token.'); }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? String((err.body as Record<string, unknown>)?.message ?? '') || 'Reset failed' : 'Something went wrong');
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm border border-border bg-elevated p-8 text-center">
          <h1 className="mb-2 font-display text-2xl font-semibold">Password reset</h1>
          <p className="mb-6 text-sm text-muted-foreground">Your password has been changed. All sessions have been revoked.</p>
          <Link href="/login" className="inline-block border border-coral bg-coral/10 px-6 py-2 font-mono text-xs uppercase tracking-widest text-coral">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm border border-border bg-elevated p-8">
        <h1 className="mb-1 font-display text-2xl font-semibold tracking-tight">Set new password</h1>
        <p className="mb-6 font-mono text-xs uppercase tracking-widest text-muted-foreground">Enter your new password</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1 block font-mono text-xs uppercase tracking-widest text-muted-foreground">New password</label>
            <div className="relative">
              <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-input bg-background px-3 py-2 pr-10 font-mono text-sm focus:border-cyan focus:outline-none" autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1 block font-mono text-xs uppercase tracking-widest text-muted-foreground">Confirm password</label>
            <div className="relative">
              <input id="confirm" type={showConfirm ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full border border-input bg-background px-3 py-2 pr-10 font-mono text-sm focus:border-cyan focus:outline-none" autoComplete="new-password" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground" aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          {error && <p className="font-mono text-xs uppercase tracking-widest text-coral">{error}</p>}
          <button type="submit" disabled={loading || !token} className="w-full border border-coral bg-coral/10 py-2.5 font-mono text-xs uppercase tracking-widest text-coral transition-colors hover:bg-coral hover:text-coral-foreground disabled:opacity-50">
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><div className="size-6 animate-spin border border-cyan border-t-transparent" /></div>}><ResetPasswordInner /></Suspense>;
}
