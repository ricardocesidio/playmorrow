'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, Chrome, Eye, EyeOff, Github, Lock, User } from 'lucide-react';

import { useAuth } from '@/lib/api/auth-context';
import { API } from '@/lib/api/client';
import {
  AuthArtCollage,
  CircuitFrame,
  HudButton,
  HudLinkLogo,
  HudPanel,
} from '@/components/playmorrow/hud';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(e.currentTarget);
    const emailOrUsername = form.get('emailOrUsername') as string;
    const password = form.get('password') as string;
    try {
      const res = await fetch('/api/auth/form-login', { method: 'POST', body: new URLSearchParams({ emailOrUsername, password }), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, redirect: 'manual' });
      if (res.type === 'opaqueredirect' || res.status === 307 || res.headers.get('location')) {
        window.location.href = res.headers.get('location') || '/games';
      } else {
        const body = await res.text();
        setError(body || 'Login failed. Please try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  };
  const searchParams = useSearchParams();

  // Show error from form-login redirect
  useEffect(() => {
    const err = searchParams.get('error');
    if (err) setError(decodeURIComponent(err));
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) router.replace('/games');
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background pm-circuit-bg">
        <div className="size-6 animate-spin border border-cyan border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) return null;

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
          <Link href="/login" className="border-b-2 border-coral pb-2 text-sm text-foreground">Sign in</Link>
          <Link
            href="/register"
            className="clip-corner hidden border border-coral bg-coral px-6 py-3 pm-display text-xs text-coral-foreground shadow-[0_0_24px_rgb(255_87_77_/_0.25)] sm:inline-flex"
          >
            Share your game <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-[1500px] gap-8 pt-3 lg:grid-cols-[1.25fr_0.95fr] xl:gap-12">
        <AuthArtCollage />

        <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center py-8 lg:justify-end">
          <HudPanel className="pm-scanline w-full max-w-[600px] px-6 py-10 sm:px-12 sm:py-14 lg:px-14" accent="muted">
            <div className="mx-auto max-w-[480px]">
              <div className="text-center">
                <h1 className="pm-display text-xl sm:text-2xl">Sign in to Playmorrow</h1>
                <div className="mx-auto mt-5 h-0.5 w-12 bg-cyan shadow-[0_0_14px_rgb(62_231_255_/_0.7)]" />
              </div>

              <form onSubmit={handleSubmit} className="mt-12 space-y-8" autoComplete="on">
                <div>
                  <label htmlFor="email" className="pm-micro mb-4 block text-muted-foreground">Email or username</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="email"
                      name="emailOrUsername"
                      type="text"
                      className="clip-corner h-14 w-full border border-cyan bg-background/80 px-14 text-sm text-foreground shadow-[0_0_24px_rgb(62_231_255_/_0.12)] outline-none placeholder:text-muted-foreground/55 focus:border-cyan focus:ring-1 focus:ring-cyan"
                      placeholder="Enter your email or username"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="pm-micro mb-4 block text-muted-foreground">Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      className="clip-corner h-14 w-full border border-input bg-background/80 px-14 pr-12 text-sm text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-cyan focus:ring-1 focus:ring-cyan"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                  <label className="inline-flex items-center gap-3 text-muted-foreground">
                    <input type="checkbox" className="size-4 appearance-none border border-border-bright bg-background checked:border-cyan checked:bg-cyan" />
                    Remember me
                  </label>
                  <Link href="/forgot-password" className="text-cyan hover:text-cyan/80">Forgot password?</Link>
                </div>

                {error && <p className="pm-micro text-coral">{error}</p>}

                <HudButton type="submit" disabled={loading} className="w-full">
                  {loading ? 'Signing in...' : 'Sign in'}
                  <ArrowUpRight className="ml-auto size-5" />
                </HudButton>
              </form>

              <div className="my-9 grid grid-cols-[1fr_auto_1fr] items-center gap-5">
                <span className="h-px bg-border" />
                <span className="pm-micro text-muted-foreground">Or continue with</span>
                <span className="h-px bg-border" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <a
                  href={`${API}/auth/github`}
                  className="clip-corner inline-flex h-14 items-center justify-center gap-3 border border-border bg-background/55 text-sm text-muted-foreground transition hover:border-cyan hover:text-cyan"
                >
                  <Github className="size-5 text-foreground" />
                  Continue with GitHub
                </a>
                <a
                  href={`${API}/auth/google`}
                  className="clip-corner inline-flex h-14 items-center justify-center gap-3 border border-border bg-background/55 text-sm text-muted-foreground transition hover:border-cyan hover:text-cyan"
                >
                  <Chrome className="size-5 text-violet" />
                  Continue with Google
                </a>
              </div>

              <p className="mt-10 text-center text-sm text-muted-foreground">
                New here?{' '}
                <Link href="/register" className="text-cyan hover:text-cyan/80">
                  Create an account
                </Link>
              </p>

              <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2"><Lock className="size-3" /> Secure session</span>
                <span className="flex gap-4">
                  <span>Terms of Service</span>
                  <span>Privacy Policy</span>
                </span>
              </div>
            </div>
          </HudPanel>
        </div>
      </main>
    </div>
  );
}
