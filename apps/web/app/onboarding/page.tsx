'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Check, Gamepad2, Building2, User, Globe, Mail, AtSign, Upload } from 'lucide-react';
import { HudButton, HudPanel } from '@/components/playmorrow/hud';
import { api, API } from '@/lib/api/client';

const STEPS = ['Account Type', 'Username', 'Profile', 'Review'];

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia',
  'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
  'Denmark', 'Djibouti', 'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
  'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala', 'Guinea', 'Guyana',
  'Haiti', 'Honduras', 'Hungary',
  'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
  'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kuwait', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Mauritania', 'Mauritius', 'Mexico', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
  'Oman',
  'Pakistan', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar',
  'Romania', 'Russia', 'Rwanda',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Somalia', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
  'Vatican City', 'Venezuela', 'Vietnam',
  'Yemen',
  'Zambia', 'Zimbabwe',
];

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
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [studioName, setStudioName] = useState('');
  const [studioSlug, setStudioSlug] = useState('');
  const [studioWebsite, setStudioWebsite] = useState('');
  const [studioDiscord, setStudioDiscord] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image too large. Max 5MB.'); return; }
    setAvatarFile(file);
    // Resize to 256x256 before creating data URL to avoid body size issues
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, 256, 256);
      setAvatarDataUrl(canvas.toDataURL('image/jpeg', 0.8));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

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
        avatarUrl: avatarDataUrl || undefined,
        provider: provider || undefined,
        email: email || undefined,
      };
      if (accountType === 'STUDIO') {
        body.studioName = studioName;
        body.studioSlug = studioSlug;
        body.studioWebsite = studioWebsite || undefined;
        body.studioDiscord = studioDiscord || undefined;
      }
      // Use direct fetch instead of api client to ensure cookies are captured
      const res = await fetch(`${API}/auth/complete-onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ message: 'Failed' }));
        throw new Error(errBody.message || 'Failed to complete setup');
      }
      setSuccess(true);
      // Full page navigation ensures cookie is sent with the request
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete setup');
    } finally { setLoading(false); }
  };

  const handleUsernameKeyDown = (e: React.KeyboardEvent) => {
    const allowed = /^[a-zA-Z0-9_]$/;
    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Tab' || e.key === 'Enter' ||
        e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') return;
    if (!allowed.test(e.key)) e.preventDefault();
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
                <input
                  value={username}
                  onChange={e => {
                    const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                    if (val.length <= 20) setUsername(val);
                  }}
                  onKeyDown={handleUsernameKeyDown}
                  className={`clip-corner h-12 w-full border bg-background/80 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-cyan focus:ring-1 focus:ring-cyan ${username && usernameAvailable === false ? 'border-coral' : 'border-input'}`}
                  placeholder="Choose a username" autoComplete="username" maxLength={20} />
              </div>
              {checkingUsername && <p className="pm-micro text-muted-foreground">Checking availability...</p>}
              {usernameAvailable === true && <p className="pm-micro text-success flex items-center gap-1"><Check className="size-3" /> Available</p>}
              {usernameAvailable === false && <p className="pm-micro text-coral">Already taken</p>}
              <p className="text-xs text-muted-foreground">3-20 characters. Letters, numbers, and underscore _ only.</p>
              <div className="space-y-1">
                <label className="pm-micro text-muted-foreground">Display name</label>
                <input value={displayName} onChange={e => setDisplayName(e.target.value.slice(0, 40))}
                  className="clip-corner h-12 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-cyan"
                  placeholder="Your display name (max 40 characters)" maxLength={40} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-bold text-foreground">{accountType === 'STUDIO' ? 'Studio Profile' : 'Profile Setup'}</h2>

              {/* Avatar upload */}
              <div className="space-y-3">
                <label className="pm-micro text-muted-foreground text-center block">Profile picture</label>
                <div className="flex flex-col items-center gap-3">
                  <div className="size-20 rounded-full border-2 border-border bg-background/60 flex items-center justify-center overflow-hidden">
                    {avatarDataUrl ? (
                      <img src={avatarDataUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <User className="size-8 text-muted-foreground" />
                    )}
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer border border-border px-5 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground transition hover:border-cyan hover:text-cyan">
                    <Upload className="mr-1 inline size-3" /> Upload photo
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </div>
              </div>

              {/* Country dropdown */}
              <div className="space-y-1">
                <label className="pm-micro text-muted-foreground">Country *</label>
                <select value={country} onChange={e => { setCountry(e.target.value); setTouched(prev => ({ ...prev, country: true })); }}
                  className={`clip-corner h-12 w-full border bg-background/80 px-4 text-sm text-foreground outline-none focus:border-cyan cursor-pointer ${touched.country && !country ? 'border-coral' : 'border-input'}`}>
                  <option value="">Select your country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="pm-micro text-muted-foreground">Bio *</label>
                <textarea value={bio} onChange={e => { setBio(e.target.value); setTouched(prev => ({ ...prev, bio: true })); }} rows={3}
                  className={`clip-corner h-24 w-full border bg-background/80 px-4 py-3 text-sm text-foreground outline-none focus:border-cyan resize-none ${touched.bio && !bio.trim() ? 'border-coral' : 'border-input'}`}
                  placeholder="Tell us about yourself (max 500)" maxLength={500} />
              </div>

              {accountType === 'STUDIO' && (
                <div className="border-t border-border pt-5 space-y-4">
                  <p className="font-display text-sm font-semibold text-foreground">Studio Details</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="pm-micro text-muted-foreground">Studio Name *</label>
                      <input value={studioName} onChange={e => { setStudioName(e.target.value); setTouched(prev => ({ ...prev, studioName: true })); }}
                        className={`clip-corner h-12 w-full border bg-background/80 px-4 text-sm text-foreground outline-none focus:border-cyan ${touched.studioName && !studioName ? 'border-coral' : 'border-input'}`}
                        placeholder="Your studio name" required />
                    </div>
                    <div className="space-y-1">
                      <label className="pm-micro text-muted-foreground">Studio Slug *</label>
                      <input value={studioSlug} onChange={e => { setStudioSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setTouched(prev => ({ ...prev, studioSlug: true })); }}
                        className={`clip-corner h-12 w-full border bg-background/80 px-4 text-sm text-foreground outline-none focus:border-cyan ${touched.studioSlug && !studioSlug ? 'border-coral' : 'border-input'}`}
                        placeholder="studio-slug" required />
                    </div>
                    <div className="space-y-1">
                      <label className="pm-micro text-muted-foreground">Website *</label>
                      <input value={studioWebsite} onChange={e => { setStudioWebsite(e.target.value); setTouched(prev => ({ ...prev, studioWebsite: true })); }}
                        className={`clip-corner h-12 w-full border bg-background/80 px-4 text-sm text-foreground outline-none focus:border-cyan ${touched.studioWebsite && !studioWebsite ? 'border-coral' : 'border-input'}`}
                        placeholder="https://..." required />
                    </div>
                    <div className="space-y-1">
                      <label className="pm-micro text-muted-foreground">Discord (optional)</label>
                      <input value={studioDiscord} onChange={e => setStudioDiscord(e.target.value)}
                        className="clip-corner h-12 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none focus:border-cyan"
                        placeholder="discord.gg/..." />
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
                {bio && <div className="flex justify-between border-b border-border/60 pb-2"><span className="text-muted-foreground">Bio</span><span className="font-medium text-foreground">{bio.slice(0, 80)}{bio.length > 80 ? '...' : ''}</span></div>}
                {avatarDataUrl && <div className="flex justify-between border-b border-border/60 pb-2"><span className="text-muted-foreground">Avatar</span><span className="text-cyan">Uploaded ✓</span></div>}
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
                if (step === 1) {
                  if (!username || username.length < 3) { setError('Username must be at least 3 characters'); return; }
                  if (usernameAvailable !== true) { setError('Username is not available'); return; }
                }
                if (step === 2) {
                  setTouched({ country: true, bio: true, studioName: true, studioSlug: true, studioWebsite: true });
                  if (!country) { setError('Select your country'); return; }
                  if (!bio.trim()) { setError('Bio is required'); return; }
                  if (accountType === 'STUDIO' && (!studioName || !studioSlug || !studioWebsite)) { setError('Studio name, slug, and website are required'); return; }
                }
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
