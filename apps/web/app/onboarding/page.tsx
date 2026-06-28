'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Check, Gamepad2, Building2, User, Globe, MapPin, Mail, AtSign } from 'lucide-react';
import { HudButton, HudPanel } from '@/components/playmorrow/hud';
import { api } from '@/lib/api/client';

const STEPS = ['Account Type', 'Username', 'Profile', 'Review'];

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const provider = searchParams.get('provider');
  const email = searchParams.get('email') || '';

  const [step, setStep] = useState(0);
  const [accountType, setAccountType] = useState<'PLAYER' | 'STUDIO' | null>(null);
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [studioName, setStudioName] = useState('');
  const [studioSlug, setStudioSlug] = useState('');
  const [studioWebsite, setStudioWebsite] = useState('');
  const [studioDiscord, setStudioDiscord] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Username availability check with debounce
  useEffect(() => {
    if (username.length < 3) { setUsernameAvailable(null); return; }
    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const res = await fetch(`/api/users/${username}`);
        setUsernameAvailable(res.status === 404);
      } catch { setUsernameAvailable(null); }
      setCheckingUsername(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const handleFinish = async () => {
    setError('');
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        accountType,
        username,
        displayName: displayName || username,
        bio,
        country,
        location,
        avatarUrl: avatarUrl || undefined,
        provider: provider || undefined,
        email: email || undefined,
      };
      if (accountType === 'STUDIO') {
        body.studioName = studioName;
        body.studioSlug = studioSlug;
        body.studioWebsite = studioWebsite || undefined;
        body.studioDiscord = studioDiscord || undefined;
      }
      await api.post('/auth/complete-onboarding', body);
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete setup');
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-full border-2 border-cyan bg-cyan/10 flex items-center justify-center">
            <Check className="size-6 text-cyan" />
          </div>
          <p className="font-display text-lg font-semibold text-foreground">Account created!</p>
          <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Progress */}
        <div className="mb-8 flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <span className={`grid size-8 place-items-center rounded-full font-mono text-xs font-bold transition-colors ${
                i <= step ? 'bg-cyan text-background' : 'border border-border text-muted-foreground'
              }`}>{i + 1}</span>
              <span className={`font-mono text-[9px] uppercase tracking-widest ${i <= step ? 'text-cyan' : 'text-muted-foreground/50'}`}>{label}</span>
            </div>
          ))}
        </div>
        <div className="h-px bg-border/60 -mt-5 mb-8" />

        <HudPanel className="p-6 sm:p-8" accent="muted">
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold text-foreground">Choose your account type</h2>
              <p className="text-sm text-muted-foreground">This cannot be changed later. Choose carefully.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <button onClick={() => setAccountType('PLAYER')} className={`cursor-pointer border p-5 text-left transition ${accountType === 'PLAYER' ? 'border-cyan bg-cyan/10' : 'border-border hover:border-cyan/50'}`}>
                  <Gamepad2 className={`size-8 mb-3 ${accountType === 'PLAYER' ? 'text-cyan' : 'text-muted-foreground'}`} />
                  <p className="font-display text-base font-semibold text-foreground">Player</p>
                  <p className="mt-1 text-xs text-muted-foreground">Explore games, wishlist, comment, follow studios, join playtests.</p>
                </button>
                <button onClick={() => setAccountType('STUDIO')} className={`cursor-pointer border p-5 text-left transition ${accountType === 'STUDIO' ? 'border-coral bg-coral/10' : 'border-border hover:border-coral/50'}`}>
                  <Building2 className={`size-8 mb-3 ${accountType === 'STUDIO' ? 'text-coral' : 'text-muted-foreground'}`} />
                  <p className="font-display text-base font-semibold text-foreground">Studio</p>
                  <p className="mt-1 text-xs text-muted-foreground">Publish games, manage roadmaps, analytics, devlogs, team members.</p>
                </button>
              </div>
              {accountType && <p className="pm-micro text-coral mt-2">⚠️ Account type cannot be changed later.</p>}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-bold text-foreground">Choose your username</h2>
              <div className="relative">
                <AtSign className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input value={username} onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
                  className={`clip-corner h-12 w-full border bg-background/80 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-cyan focus:ring-1 focus:ring-cyan ${username && usernameAvailable === false ? 'border-coral' : 'border-input'}`}
                  placeholder="Choose a username" autoComplete="username" />
              </div>
              {checkingUsername && <p className="pm-micro text-muted-foreground">Checking availability...</p>}
              {usernameAvailable === true && <p className="pm-micro text-success flex items-center gap-1"><Check className="size-3" /> Available</p>}
              {usernameAvailable === false && <p className="pm-micro text-coral">Already taken</p>}
              <p className="text-xs text-muted-foreground">3-20 characters. Letters, numbers, and underscore only.</p>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                className="clip-corner h-12 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-cyan"
                placeholder="Display name (optional)" />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-bold text-foreground">{accountType === 'STUDIO' ? 'Studio Profile' : 'Profile Setup'}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="pm-micro text-muted-foreground">Avatar URL</label>
                  <input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} className="clip-corner h-12 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none focus:border-cyan" placeholder="https://..." />
                </div>
                <div className="space-y-1">
                  <label className="pm-micro text-muted-foreground">Country</label>
                  <input value={country} onChange={e => setCountry(e.target.value)} className="clip-corner h-12 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none focus:border-cyan" placeholder="Country" />
                </div>
                <div className="space-y-1">
                  <label className="pm-micro text-muted-foreground">Location</label>
                  <input value={location} onChange={e => setLocation(e.target.value)} className="clip-corner h-12 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none focus:border-cyan" placeholder="City, State" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="pm-micro text-muted-foreground">Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="clip-corner h-24 w-full border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none focus:border-cyan resize-none" placeholder="Tell us about yourself (max 500)" maxLength={500} />
              </div>

              {accountType === 'STUDIO' && (
                <div className="border-t border-border pt-5 space-y-4">
                  <p className="font-display text-sm font-semibold text-foreground">Studio Details</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="pm-micro text-muted-foreground">Studio Name *</label>
                      <input value={studioName} onChange={e => setStudioName(e.target.value)} className="clip-corner h-12 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none focus:border-cyan" placeholder="Your studio name" />
                    </div>
                    <div className="space-y-1">
                      <label className="pm-micro text-muted-foreground">Studio Slug *</label>
                      <input value={studioSlug} onChange={e => setStudioSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} className="clip-corner h-12 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none focus:border-cyan" placeholder="studio-slug" />
                    </div>
                    <div className="space-y-1">
                      <label className="pm-micro text-muted-foreground">Website</label>
                      <input value={studioWebsite} onChange={e => setStudioWebsite(e.target.value)} className="clip-corner h-12 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none focus:border-cyan" placeholder="https://..." />
                    </div>
                    <div className="space-y-1">
                      <label className="pm-micro text-muted-foreground">Discord</label>
                      <input value={studioDiscord} onChange={e => setStudioDiscord(e.target.value)} className="clip-corner h-12 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none focus:border-cyan" placeholder="discord.gg/..." />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-bold text-foreground">Review your info</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-border/60 pb-2"><span className="text-muted-foreground">Account Type</span><span className="font-medium text-foreground">{accountType}</span></div>
                <div className="flex justify-between border-b border-border/60 pb-2"><span className="text-muted-foreground">Username</span><span className="font-medium text-foreground">@{username}</span></div>
                {displayName && <div className="flex justify-between border-b border-border/60 pb-2"><span className="text-muted-foreground">Display Name</span><span className="font-medium text-foreground">{displayName}</span></div>}
                {country && <div className="flex justify-between border-b border-border/60 pb-2"><span className="text-muted-foreground">Country</span><span className="font-medium text-foreground">{country}</span></div>}
                {location && <div className="flex justify-between border-b border-border/60 pb-2"><span className="text-muted-foreground">Location</span><span className="font-medium text-foreground">{location}</span></div>}
              </div>
              {error && <p className="pm-micro text-coral">{error}</p>}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between gap-4">
            <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
              className="cursor-pointer border border-border px-5 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground transition hover:border-cyan hover:text-cyan disabled:opacity-30">
              Back
            </button>
            {step < 3 ? (
              <button onClick={() => {
                if (step === 0 && !accountType) { setError('Select an account type'); return; }
                if (step === 1 && (!username || username.length < 3 || usernameAvailable !== true)) { setError('Choose an available username'); return; }
                if (step === 2 && accountType === 'STUDIO' && (!studioName || !studioSlug)) { setError('Studio name and slug required'); return; }
                setError('');
                setStep(step + 1);
              }}
                className="cursor-pointer border border-cyan bg-cyan/10 px-6 py-2 font-mono text-xs uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background">
                Continue <ArrowRight className="ml-1 inline size-3" />
              </button>
            ) : (
              <HudButton onClick={handleFinish} disabled={loading}>
                {loading ? 'Creating account...' : 'Finish Setup'}
              </HudButton>
            )}
          </div>
        </HudPanel>
      </div>
    </div>
  );
}
