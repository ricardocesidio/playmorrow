'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, User } from 'lucide-react';

import { useAuth } from '@/lib/api/auth-context';
import { api, ApiError } from '@/lib/api/client';
import { HudButton } from '@/components/playmorrow/hud';

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
      <div className="flex min-h-screen items-center justify-center">
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

  const inputClass = 'clip-corner h-12 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-cyan focus:ring-1 focus:ring-cyan';

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <User className="size-6 text-primary" />
        <h1 className="text-3xl font-semibold tracking-tight">Profile Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-border bg-elevated p-6">
          <div className="space-y-5">
            <div>
              <label htmlFor="username" className="pm-micro mb-2 block text-muted-foreground">Username</label>
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
              <label htmlFor="displayName" className="pm-micro mb-2 block text-muted-foreground">Display Name</label>
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
              <label htmlFor="email" className="pm-micro mb-2 block text-muted-foreground">Email</label>
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
              <label htmlFor="avatarUrl" className="pm-micro mb-2 block text-muted-foreground">Avatar URL</label>
              <input
                id="avatarUrl"
                type="text"
                value={form.avatarUrl}
                onChange={(e) => handleChange('avatarUrl', e.target.value)}
                className={inputClass}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div>
              <label htmlFor="bio" className="pm-micro mb-2 block text-muted-foreground">Bio</label>
              <textarea
                id="bio"
                value={form.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                className="clip-corner h-24 w-full resize-none border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-cyan focus:ring-1 focus:ring-cyan"
                placeholder="Tell us about yourself"
                maxLength={500}
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">{form.bio.length}/500</p>
            </div>

            <div>
              <label htmlFor="location" className="pm-micro mb-2 block text-muted-foreground">Location</label>
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
          <p className="rounded-lg border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral">{error}</p>
        )}

        {success && (
          <p className="rounded-lg border border-cyan/30 bg-cyan/5 px-4 py-3 text-sm text-cyan">Profile updated successfully.</p>
        )}

        <HudButton type="submit" disabled={saving} className="w-full">
          <Save className="size-5" />
          {saving ? 'Saving...' : 'Save Changes'}
        </HudButton>
      </form>
    </div>
  );
}
