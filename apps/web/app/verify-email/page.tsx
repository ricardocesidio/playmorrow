'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api/client';

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) { setStatus('error'); setError('No verification token provided.'); return; }

    api.post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch((err) => { setStatus('error'); setError(err instanceof ApiError ? String((err.body as Record<string, unknown>)?.message ?? '') || 'Verification failed' : 'Verification failed'); });
  }, [searchParams]);

  const handleResend = async () => {
    if (!resendEmail.trim()) return;
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email: resendEmail.trim() });
      setResent(true);
    } catch { /* ignore */ }
    setResending(false);
  };

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center bg-background"><div className="size-6 animate-spin border border-cyan border-t-transparent" /></div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm border border-border bg-elevated p-8 text-center">
        {status === 'success' ? (
          <>
            <h1 className="mb-2 font-display text-2xl font-semibold">Email verified</h1>
            <p className="mb-6 text-sm text-muted-foreground">Your email has been verified successfully.</p>
            <Link href="/login" className="inline-block border border-coral bg-coral/10 px-6 py-2 font-mono text-xs uppercase tracking-widest text-coral">Sign in</Link>
          </>
        ) : (
          <>
            <h1 className="mb-2 font-display text-2xl font-semibold">Verification failed</h1>
            <p className="mb-4 text-sm text-muted-foreground">{error}</p>

            {!resent ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Enter your email to receive a new verification link:</p>
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full border border-input bg-background px-3 py-2 font-mono text-sm focus:border-cyan focus:outline-none"
                />
                <button
                  onClick={handleResend}
                  disabled={resending || !resendEmail.trim()}
                  className="w-full border border-coral bg-coral/10 py-2 font-mono text-xs uppercase tracking-widest text-coral transition-colors hover:bg-coral hover:text-coral-foreground disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend verification email'}
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">If the email exists, a verification link has been sent.</p>
            )}

            <div className="mt-4">
              <Link href="/login" className="font-mono text-xs uppercase tracking-widest text-cyan underline">Back to login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><div className="size-6 animate-spin border border-cyan border-t-transparent" /></div>}><VerifyEmailInner /></Suspense>;
}
