'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2, Send, KeyRound, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/lib/api/auth-context';
import { api, ApiError } from '@/lib/api/client';
import { SiteHeader } from '@/components/site-header';
import { Input } from '@/components/ui/input';
import { SettingsNav } from '@/components/settings-nav';

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, refreshMe } = useAuth();

  const [email, setEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
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

  const handleSendCode = async () => {
    if (!email || email === user.email) return;
    setSendingCode(true);
    try {
      await api.post('/auth/resend-verification', { email });
      setCodeSent(true);
      toast.success('Verification code sent to ' + email);
    } catch {
      toast.error('Failed to send verification code. Try again.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!email || email === user.email) return;
    if (emailChangeLimitReached) {
      toast.error('Email change limit reached.');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/users/me/profile', { email });
      await refreshMe();
      toast.success('Email updated successfully.');
    } catch (err: unknown) {
      if (err instanceof ApiError && err.body && typeof err.body === 'object') {
        const body = err.body as Record<string, unknown>;
        const msg = Array.isArray(body.message)
          ? (body.message as string[]).join(', ')
          : typeof body.message === 'string'
            ? body.message
            : 'Failed to update email';
        toast.error(msg);
      } else {
        toast.error('Failed to update email.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Password is required to delete your account.');
      return;
    }
    setDeleting(true);
    try {
      await api.delete('/users/me', { password: deletePassword });
      toast.success('Account deleted.');
      setTimeout(() => router.replace('/'), 1000);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.body && typeof err.body === 'object') {
        const body = err.body as Record<string, unknown>;
        toast.error(typeof body.message === 'string' ? body.message : 'Failed to delete account.');
      } else {
        toast.error('Failed to delete account.');
      }
    } finally {
      setDeleting(false);
    }
  };

  const inputClass = 'h-11 shadow-[0_0_20px_rgb(62_231_255_/_0.15)]';

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

        <h1 className="mb-2 mt-6 font-display text-3xl font-black uppercase tracking-tight text-white">Account Settings</h1>
        <SettingsNav />

        {/* Email Change */}
        <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
          <div className="mb-4 flex items-center gap-3 border-b border-border/50 pb-3">
            <KeyRound className="size-5 text-cyan" />
            <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan">Email Address</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="settings-email" className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Email</label>
              <Input
                id="settings-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="Your email"
                autoComplete="email"
                disabled={emailChangeLimitReached}
              />
              {emailChangeLimitReached ? (
                <p className="mt-1.5 text-xs text-coral">Email change limit reached. Contact support for assistance.</p>
              ) : (
                <p className="mt-1.5 text-xs text-muted-foreground">You can change your email up to 2 times.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode || !email || email === user.email}
                className="clip-corner inline-flex cursor-pointer items-center gap-2 border border-cyan/40 bg-cyan/5 px-5 py-2.5 font-mono text-[0.6rem] uppercase tracking-widest text-cyan transition hover:bg-cyan/15 disabled:pointer-events-none disabled:opacity-40"
              >
                <Send className="size-4" />
                {sendingCode ? 'Sending...' : codeSent ? 'Resend Code' : 'Send Verification Code'}
              </button>

              {codeSent && (
                <div className="flex w-full items-end gap-3">
                  <div className="flex-1">
                    <label htmlFor="email-code" className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Verification Code</label>
                    <Input
                      id="email-code"
                      type="text"
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value)}
                      className={inputClass}
                      placeholder="6-digit code"
                      maxLength={6}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveEmail}
                    disabled={saving || !emailCode || !email || email === user.email}
                    className="clip-corner inline-flex h-11 cursor-pointer items-center gap-2 border border-cyan bg-cyan/10 px-5 font-mono text-[0.6rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Save className="size-4" />
                    {saving ? 'Saving...' : 'Verify & Save'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Deletion */}
        <div className="mt-6">
          <div className="clip-corner border border-coral/30 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <div className="mb-4 flex items-center gap-3 border-b border-coral/20 pb-3">
              <ShieldAlert className="size-5 text-coral" />
              <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-coral">Danger Zone</h2>
            </div>

            <p className="mb-4 font-mono text-[0.55rem] leading-relaxed text-muted-foreground">
              Once you delete your account, there is no going back. All your data will be permanently removed. This action is irreversible.
            </p>

            {!deleteConfirmOpen ? (
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="clip-corner inline-flex cursor-pointer items-center gap-2 border border-coral/50 bg-coral/5 px-5 py-2.5 font-mono text-[0.6rem] uppercase tracking-widest text-coral transition hover:bg-coral hover:text-coral-foreground"
              >
                <Trash2 className="size-4" />
                Delete Account
              </button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-medium text-coral">Are you absolutely sure? This cannot be undone.</p>
                <div>
                  <label htmlFor="delete-password" className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Confirm Your Password</label>
                  <Input
                    id="delete-password"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="h-11 border-coral/50 shadow-[0_0_20px_rgb(249_76_76_/_0.12)]"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleting || !deletePassword}
                    className="clip-corner inline-flex cursor-pointer items-center gap-2 border border-coral bg-coral/10 px-5 py-2.5 font-mono text-[0.6rem] uppercase tracking-widest text-coral transition hover:bg-coral hover:text-coral-foreground disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                    {deleting ? 'Deleting...' : 'Permanently Delete My Account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDeleteConfirmOpen(false); setDeletePassword(''); }}
                    className="clip-corner inline-flex cursor-pointer items-center gap-2 border border-border/50 bg-background/40 px-5 py-2.5 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground transition hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
