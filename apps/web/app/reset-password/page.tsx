'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { api, ApiError } from '@/lib/api/client';
import { SiteHeader } from '@/components/site-header';
import { Input } from '@/components/ui/input';

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
      <div className="relative min-h-screen bg-[#020609]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
        <SiteHeader />
        <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
          <div className="clip-corner w-full max-w-sm border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 text-center shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h1 className="font-display font-black uppercase tracking-tight text-white">Password reset</h1>
            <p className="mb-6 mt-2 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Your password has been changed. All sessions have been revoked.</p>
            <Link href="/login" className="clip-corner inline-flex items-center justify-center border border-cyan bg-cyan/10 px-6 py-2.5 font-mono text-xs uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background">Sign in</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#020609]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
      <SiteHeader />
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
        <div className="clip-corner w-full max-w-sm border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
          <h1 className="font-display font-black uppercase tracking-tight text-white">Set new password</h1>
          <p className="mb-6 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Enter your new password</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="mb-1 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">New password</label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10 shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm" className="mb-1 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Confirm password</label>
              <div className="relative">
                <Input id="confirm" type={showConfirm ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="pr-10 shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" autoComplete="new-password" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground" aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            {error && <p className="font-mono text-[0.6rem] uppercase tracking-widest text-coral">{error}</p>}
            <button type="submit" disabled={loading || !token} className="clip-corner w-full cursor-pointer border border-cyan bg-cyan/10 py-3 font-mono text-xs uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background disabled:opacity-50">
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#020609]"><div className="size-6 animate-spin border border-cyan border-t-transparent" /></div>}><ResetPasswordInner /></Suspense>;
}
