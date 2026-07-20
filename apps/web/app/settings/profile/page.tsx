'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Bell } from 'lucide-react';

import { useAuth } from '@/lib/api/auth-context';
import { PushNotificationToggle } from '@/components/push-toggle';
import { api, ApiError } from '@/lib/api/client';
import { SiteHeader } from '@/components/site-header';

interface FormData {
  username: string;
  displayName: string;
  email: string;
  bio: string;
  location: string;
  avatarUrl: string;
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, refreshMe } = useAuth();
  const [form, setForm] = useState<FormData>({
    username: '',
    displayName: '',
    email: '',
    bio: '',
    location: '',
    avatarUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || '',
        displayName: user.displayName || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        avatarUrl: user.avatarUrl || '',
      });
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020609]">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const emailChangeLimitReached = (user.emailChangeCount ?? 0) >= 2;

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const payload: Record<string, string> = {};
      if (form.username !== user.username) payload.username = form.username;
      if (form.displayName !== user.displayName) payload.displayName = form.displayName;
      if (form.email !== user.email) payload.email = form.email;
      if (form.bio !== (user.bio ?? '')) payload.bio = form.bio;
      if (form.location !== (user.location ?? '')) payload.location = form.location;
      if (form.avatarUrl !== (user.avatarUrl ?? '')) payload.avatarUrl = form.avatarUrl;

      if (Object.keys(payload).length === 0) {
        setSuccess(true);
        return;
      }

      await api.patch('/users/me/profile', payload);
      await refreshMe();
      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.body && typeof err.body === 'object') {
        const body = err.body as Record<string, unknown>;
        const messages: string[] = [];
        if (Array.isArray(body.message)) {
          messages.push(...body.message.map((m: unknown) => String(m)));
        } else if (typeof body.message === 'string') {
          messages.push(body.message);
        }
        setError(messages.join(', ') || 'Failed to update profile');
      } else {
        setError('Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]';

  return (
    <div className="relative min-h-screen bg-[#020609]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
      <SiteHeader />

      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground hover:text-cyan"
        >
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>

        <h1 className="mb-8 mt-6 font-display text-3xl font-black uppercase tracking-tight text-white">Profile Settings</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <div className="space-y-5">
              <div>
                <label htmlFor="username" className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Username</label>
                <input
                  id="username"
                  type="text"
                  value={form.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  className={inputClass}
                  placeholder="Your username"
                  autoComplete="username"
                />
              </div>

              <div>
                <label htmlFor="displayName" className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Display Name</label>
                <input
                  id="displayName"
                  type="text"
                  value={form.displayName}
                  onChange={(e) => handleChange('displayName', e.target.value)}
                  className={inputClass}
                  placeholder="Your display name"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Email</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={inputClass}
                  placeholder="Your email"
                  autoComplete="email"
                  disabled={emailChangeLimitReached}
                />
                {emailChangeLimitReached ? (
                  <p className="mt-1.5 text-xs text-coral">Email change limit reached</p>
                ) : (
                  <p className="mt-1.5 text-xs text-muted-foreground">You can change your email up to 2 times.</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Avatar</label>
                <div className="flex items-center gap-3">
                  {form.avatarUrl ? (
                    <div className="relative">
                      <img src={form.avatarUrl} alt="" className="size-16 border border-border object-cover" />
                      <button type="button" onClick={() => handleChange('avatarUrl', '')} className="absolute -right-1 -top-1 cursor-pointer bg-coral p-0.5 text-white text-xs">x</button>
                    </div>
                  ) : null}
                  <label className="clip-corner cursor-pointer border border-cyan/60 bg-cyan/5 px-4 py-2 font-mono text-[0.55rem] uppercase tracking-widest text-cyan hover:bg-cyan/10">
                    Upload
                    <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) return;
                      const reader = new FileReader();
                      reader.onload = () => handleChange('avatarUrl', reader.result as string);
                      reader.readAsDataURL(file);
                    }} />
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Bio</label>
                <textarea
                  id="bio"
                  value={form.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  className="clip-corner h-24 w-full resize-none border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]"
                  placeholder="Tell us about yourself"
                  maxLength={500}
                />
                <p className="mt-1 text-right text-xs text-muted-foreground">{form.bio.length}/500</p>
              </div>

              <div>
                <label htmlFor="location" className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Location</label>
                <input
                  id="location"
                  type="text"
                  value={form.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className={inputClass}
                  placeholder="City, Country"
                  maxLength={80}
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="clip-corner border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral">{error}</p>
          )}

          {success && (
            <p className="clip-corner border border-cyan/30 bg-cyan/5 px-4 py-3 text-sm text-cyan">Profile updated successfully.</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="clip-corner inline-flex h-14 w-full cursor-pointer items-center justify-center gap-3 border border-cyan bg-cyan/10 px-7 font-mono text-xs uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background disabled:pointer-events-none disabled:opacity-50"
          >
            <Save className="size-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Change Password */}
        <ChangePasswordSection />

        {/* Push Notifications */}
        <div className="mt-8">
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <div className="mb-3 flex items-center gap-3 border-b border-border/50 pb-3">
              <Bell className="size-5 text-cyan" />
              <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan">Push Notifications</h2>
            </div>
            <p className="mb-4 font-mono text-[0.55rem] text-muted-foreground">
              Receive browser notifications when someone follows you, comments on your content, or sends you an invitation.
            </p>
            <PushNotificationToggle />
          </div>
        </div>

        {/* Privacy & Marketing (surfaced) */}
        <div className="mt-6 rounded border border-border/60 bg-black/40 p-5 text-xs">
          <div className="mb-2 font-medium text-cyan">Privacy &amp; Marketing Preferences</div>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <div>Marketing emails: <span className="text-foreground">{(user as any).marketingOptInAt ? 'Opted in' : 'Not opted in'}</span></div>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <div>Partner marketing: <span className="text-foreground">{(user as any).partnerMarketingOptInAt ? 'Opted in' : 'Not opted in'}</span></div>
          <div className="mt-1 text-[10px] text-muted-foreground">Full editing controls and data export coming soon. Use account deletion for full erasure.</div>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordSection() {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    if (!current || !newPass || !confirm) { setMsg('All fields are required.'); return; }
    if (newPass !== confirm) { setMsg('Passwords do not match.'); return; }
    if (newPass.length < 8) { setMsg('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: current, newPassword: newPass }), credentials: 'include' });
      if (!res.ok) { const b = await res.json().catch(() => ({})); setMsg(b.message || 'Failed to change password.'); }
      else { setMsg('Password changed successfully.'); setCurrent(''); setNewPass(''); setConfirm(''); }
    } catch { setMsg('Connection error.'); }
    setLoading(false);
  };

  return (
    <form onSubmit={handleChange} className="mt-6 clip-corner border border-border/70 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] sm:p-6">
      <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-4">Change Password</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Current password" className="clip-corner h-11 border border-input bg-background/80 px-4 text-sm text-foreground outline-none focus:border-cyan" />
        <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="New password" className="clip-corner h-11 border border-input bg-background/80 px-4 text-sm text-foreground outline-none focus:border-cyan" />
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" className="clip-corner h-11 border border-input bg-background/80 px-4 text-sm text-foreground outline-none focus:border-cyan" />
      </div>
      {msg && <p className={`mt-3 font-mono text-xs ${msg.includes('success') ? 'text-cyan' : 'text-coral'}`}>{msg}</p>}
      <button type="submit" disabled={loading} className="clip-corner mt-4 inline-flex cursor-pointer items-center gap-2 border border-coral/50 bg-coral/5 px-5 py-2.5 font-mono text-[0.6rem] uppercase tracking-widest text-coral hover:bg-coral hover:text-coral-foreground disabled:opacity-50">
        {loading ? 'Changing...' : 'Change Password'}
      </button>
    </form>
  );
}
