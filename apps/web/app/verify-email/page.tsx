'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Mail } from 'lucide-react';

import { useAuth } from '@/lib/api/auth-context';
import {
  CircuitFrame,
  HudButton,
  HudLinkLogo,
  HudPanel,
} from '@/components/playmorrow/hud';

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail, resendVerificationCode } = useAuth();

  const email = searchParams.get('email') ?? '';
  const accountType = searchParams.get('accountType') ?? 'PLAYER';
  const fromLogin = searchParams.get('from') === 'login';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startCooldown = useCallback(() => {
    setCooldown(60);
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await verifyEmail(email, code.trim());
      setSuccess(true);
      if (accountType === 'STUDIO') {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      if (msg.toLowerCase().includes('expired')) {
        setError('This code has expired. Request a new one.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMessage('');
    setError('');
    try {
      await resendVerificationCode(email);
      setResendMessage('If your account still needs verification, a new code has been sent.');
      startCooldown();
    } catch {
      setResendMessage('Failed to resend code. Please try again.');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-5 pb-8 text-foreground sm:px-8 lg:px-10">
      <CircuitFrame className="opacity-45" />
      <header className="relative z-10 mx-auto flex h-20 max-w-[1500px] items-center justify-between">
        <HudLinkLogo />
        <nav className="hidden items-center gap-14 text-sm text-muted-foreground md:flex" aria-label="Main navigation">
          <Link href="/games" className="hover:text-cyan">Games</Link>
          <Link href="/studios" className="hover:text-cyan">Studios</Link>
          <Link href="/feed" className="hover:text-cyan">Live Feed</Link>
        </nav>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-cyan">Sign in</Link>
          <Link
            href="/register"
            className="clip-corner hidden border border-coral bg-coral px-6 py-3 pm-display text-xs text-coral-foreground shadow-[0_0_24px_rgb(255_87_77_/_0.25)] sm:inline-flex"
          >
            Share your game <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-7rem)] items-center justify-center px-4 py-8">
        <HudPanel className="pm-scanline w-full max-w-[440px] px-6 py-9 sm:px-10 sm:py-12" accent="muted">
          <div className="mx-auto max-w-[380px] text-center">
            <Mail className="mx-auto size-10 text-cyan drop-shadow-[0_0_14px_rgb(62_231_255_/_0.5)]" />
            {fromLogin && (
              <p className="pm-micro mt-4 text-coral">Please verify your email to continue.</p>
            )}
            <h1 className="pm-display mt-6 text-xl sm:text-2xl">Verify your email</h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              We sent a 6-digit code to <strong className="text-foreground">{email}</strong>.
              Enter it below to activate your PlayMorrow account.
            </p>

            {!success && (
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div>
                  <label htmlFor="code" className="pm-micro mb-3 block text-left text-muted-foreground">
                    Verification code
                  </label>
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setCode(val);
                    }}
                    placeholder="000000"
                    className="clip-corner h-14 w-full border border-cyan bg-background/80 px-4 text-center text-2xl tracking-[0.5em] text-foreground shadow-[0_0_24px_rgb(62_231_255_/_0.12)] outline-none placeholder:text-muted-foreground/30 focus:border-cyan focus:ring-1 focus:ring-cyan"
                  />
                </div>

                {error && <p className="pm-micro text-coral">{error}</p>}
                {resendMessage && <p className="pm-micro text-cyan">{resendMessage}</p>}

                <HudButton type="submit" disabled={loading || code.length !== 6} className="w-full">
                  {loading ? 'Verifying...' : 'Verify email'}
                  <ArrowUpRight className="ml-auto size-5" />
                </HudButton>
              </form>
            )}

            {!success && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className="pm-micro cursor-pointer text-muted-foreground underline underline-offset-2 hover:text-cyan disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
                >
                  {cooldown > 0
                    ? `Resend code in ${cooldown}s`
                    : 'Resend code'}
                </button>
              </div>
            )}

            {success && (
              <div className="mt-8">
                <p className="text-sm text-cyan">Email verified successfully! Redirecting...</p>
              </div>
            )}
          </div>
        </HudPanel>
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-6 animate-spin border border-cyan border-t-transparent" />
      </div>
    }>
      <VerifyEmailInner />
    </Suspense>
  );
}