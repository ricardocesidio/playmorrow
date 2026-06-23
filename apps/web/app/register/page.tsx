'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, Eye, EyeOff, Lock, Mail, User, Gamepad2, Building2 } from 'lucide-react';

import { useAuth } from '@/lib/api/auth-context';
import {
  AuthArtCollage,
  CircuitFrame,
  HudButton,
  HudLinkLogo,
  HudPanel,
} from '@/components/playmorrow/hud';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  const [accountType, setAccountType] = useState<'PLAYER' | 'STUDIO'>('PLAYER');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [partnerMarketingOptIn, setPartnerMarketingOptIn] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) router.replace('/dashboard');
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background pm-circuit-bg">
        <div className="size-6 animate-spin border border-cyan border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !username.trim() || !displayName.trim() || !password) {
      setError('All fields required');
      return;
    }
    if (!/^[a-zA-Z0-9\s]+$/.test(displayName.trim()) || displayName.trim().length > 30) {
      setError('Name can only contain letters, numbers, and spaces (max 30 characters).');
      return;
    }
    if (!/^[a-zA-Z0-9]+$/.test(username.trim()) || username.trim().length > 12) {
      setError('Username can only contain letters and numbers (max 12 characters).');
      return;
    }
    if (password.length < 8 || !/[^a-zA-Z0-9]/.test(password)) {
      setError('Password must be at least 8 characters and include one special character.');
      return;
    }
    if (!acceptedTerms) {
      setError('You must agree to the Terms of Service, Privacy Policy, and Community Guidelines.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await register({
        email: email.trim(),
        username: username.trim(),
        displayName: displayName.trim(),
        password,
        accountType,
        acceptedTerms,
        marketingOptIn,
        partnerMarketingOptIn,
      });
      if (result.requiresEmailVerification) {
        const params = new URLSearchParams({ email: result.email, accountType });
        router.push(`/verify-email?${params.toString()}`);
      } else {
        router.push(accountType === 'STUDIO' ? '/studios/new?from=register' : '/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
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

      <main className="relative z-10 mx-auto grid max-w-[1500px] gap-8 pt-3 lg:grid-cols-[1.25fr_0.95fr] xl:gap-12">
        <AuthArtCollage />

        <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center py-8 lg:justify-end">
          <HudPanel className="pm-scanline w-full max-w-[600px] px-6 py-9 sm:px-12 sm:py-12 lg:px-14" accent="muted">
            <div className="mx-auto max-w-[480px]">
              <div className="text-center">
                <h1 className="pm-display text-xl sm:text-2xl">Create your signal</h1>
                <div className="mx-auto mt-5 h-0.5 w-12 bg-cyan shadow-[0_0_14px_rgb(62_231_255_/_0.7)]" />
              </div>

              {/* Account type cards */}
              <div className="mt-8 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType('PLAYER')}
                  className={`flex flex-col items-start gap-2 border p-4 text-left transition-colors cursor-pointer ${
                    accountType === 'PLAYER'
                      ? 'border-cyan bg-cyan/10 text-cyan'
                      : 'border-border bg-background/50 text-muted-foreground hover:border-cyan/50'
                  }`}
                >
                  <Gamepad2 className="size-5" />
                  <span className="font-mono text-[10px] uppercase tracking-widest">Player</span>
                  <span className="text-[11px] leading-relaxed text-muted-foreground">
                    I want to discover games, follow updates, comment, and save games to my wishlist.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('STUDIO')}
                  className={`flex flex-col items-start gap-2 border p-4 text-left transition-colors cursor-pointer ${
                    accountType === 'STUDIO'
                      ? 'border-coral bg-coral/10 text-coral'
                      : 'border-border bg-background/50 text-muted-foreground hover:border-coral/50'
                  }`}
                >
                  <Building2 className="size-5" />
                  <span className="font-mono text-[10px] uppercase tracking-widest">Studio / Indie Company</span>
                  <span className="text-[11px] leading-relaxed text-muted-foreground">
                    I want to share my game, create a studio profile, publish devlogs, and grow my community.
                  </span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-10 space-y-5">
                <HudTextField
                  id="displayName"
                  label="Name"
                  value={displayName}
                  onChange={setDisplayName}
                  placeholder="Your name"
                  icon={<User className="size-5" />}
                />
                <HudTextField
                  id="username"
                  label="Username"
                  value={username}
                  onChange={setUsername}
                  placeholder="Choose a username"
                  autoComplete="username"
                  icon={<User className="size-5" />}
                  hint="Letters and numbers only. Max 12 characters."
                />
                <HudTextField
                  id="email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="Enter your email"
                  autoComplete="email"
                  icon={<Mail className="size-5" />}
                />
                <HudTextField
                  id="password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  icon={<Lock className="size-5" />}
                  hint="Use at least 8 characters and one special character."
                />

                {/* Consent checkboxes */}
                <div className="space-y-4 pt-2">
                  <label className="flex items-start gap-3 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 size-4 shrink-0 appearance-none border border-border-bright bg-background checked:border-cyan checked:bg-cyan"
                    />
                    <span>
                      I agree to the{' '}
                      <Link href="/terms" className="text-cyan hover:text-cyan/80 underline underline-offset-2">
                        Terms of Service
                      </Link>
                      ,{' '}
                      <Link href="/privacy" className="text-cyan hover:text-cyan/80 underline underline-offset-2">
                        Privacy Policy
                      </Link>
                      , and{' '}
                      <Link href="/community-guidelines" className="text-cyan hover:text-cyan/80 underline underline-offset-2">
                        Community Guidelines
                      </Link>
                      .
                    </span>
                  </label>

                  <label className="flex items-start gap-3 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={marketingOptIn}
                      onChange={(e) => setMarketingOptIn(e.target.checked)}
                      className="mt-0.5 size-4 shrink-0 appearance-none border border-border-bright bg-background checked:border-cyan checked:bg-cyan"
                    />
                    <span>
                      Yes, PlayMorrow may send me news about indie games, devlogs, roadmap updates, launches, events, and creator opportunities.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={partnerMarketingOptIn}
                      onChange={(e) => setPartnerMarketingOptIn(e.target.checked)}
                      className="mt-0.5 size-4 shrink-0 appearance-none border border-border-bright bg-background checked:border-cyan checked:bg-cyan"
                    />
                    <span>
                      Yes, PlayMorrow may use my activity to personalize recommendations and, where allowed, share limited information with trusted partners for marketing and advertising.
                    </span>
                  </label>
                </div>

                {error && <p className="pm-micro text-coral">{error}</p>}

                <HudButton type="submit" disabled={loading} className="w-full">
                  {loading ? 'Creating...' : 'Create account'}
                  <ArrowUpRight className="ml-auto size-5" />
                </HudButton>
              </form>

              <p className="mt-10 text-center text-sm text-muted-foreground">
                Already transmitting?{' '}
                <Link href="/login" className="text-cyan hover:text-cyan/80">
                  Sign in
                </Link>
              </p>

              <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2"><Lock className="size-3" /> Secure session</span>
                <span>Creator access ready</span>
              </div>
            </div>
          </HudPanel>
        </div>
      </main>
    </div>
  );
}

function HudTextField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  icon,
  hint,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete?: string;
  icon: ReactNode;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div>
      <label htmlFor={id} className="pm-micro mb-3 block text-muted-foreground">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="clip-corner h-12 w-full border border-input bg-background/80 px-14 pr-12 text-sm text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-cyan focus:ring-1 focus:ring-cyan"
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        )}
      </div>
      {hint && <p className="pm-micro mt-2 text-muted-foreground/60">{hint}</p>}
    </div>
  );
}