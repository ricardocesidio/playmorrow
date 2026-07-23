'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LogoIcon } from '@/components/logo-icon';
import { api, ApiError } from '@/lib/api/client';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { SiteHeader } from '@/components/site-header';

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
      <div className="relative min-h-screen bg-[#020609]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
        <SiteHeader />
        <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
          <div className="clip-corner w-full max-w-sm border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 text-center shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h1 className="font-display font-black uppercase tracking-tight text-white">Check your email</h1>
            <p className="mt-2 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">If an account exists with that email, a reset link has been sent.</p>
            <Link href="/login" className={cn(buttonVariants({ className: "mt-6" }))}>Back to sign in</Link>
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
        <Link href="/" className="mb-8 flex items-center gap-2 font-display text-lg font-semibold text-white">
          <span className="grid size-8 place-items-center bg-cyan/10 text-cyan"><LogoIcon className="size-4" /></span>
          <span>Playmorrow</span>
        </Link>
        <div className="clip-corner w-full max-w-sm border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
          <h1 className="font-display font-black uppercase tracking-tight text-white">Reset password</h1>
          <p className="mb-6 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Enter your email</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Email</label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            {error && <p className="font-mono text-[0.6rem] uppercase tracking-widest text-coral">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Link href="/login" className="font-mono text-xs uppercase tracking-widest text-cyan underline">Back to sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
