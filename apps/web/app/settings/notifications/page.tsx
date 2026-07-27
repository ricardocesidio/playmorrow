'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bell, BellOff, Save } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/lib/api/auth-context';
import { api, ApiError } from '@/lib/api/client';
import { SiteHeader } from '@/components/site-header';
import { SettingsNav } from '@/components/settings-nav';

const STORAGE_KEY = 'playmorrow_notification_preferences';

interface NotificationPreferences {
  devlogUpdates: boolean;
  roadmapUpdates: boolean;
  contentComments: boolean;
  contentReactions: boolean;
  weeklyReports: boolean;
  marketingEmails: boolean;
}

const defaultPrefs: NotificationPreferences = {
  devlogUpdates: true,
  roadmapUpdates: true,
  contentComments: true,
  contentReactions: true,
  weeklyReports: false,
  marketingEmails: false,
};

const toggleDefs: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  { key: 'devlogUpdates', label: 'New Devlogs', description: 'When a studio you follow publishes a new devlog' },
  { key: 'roadmapUpdates', label: 'Roadmap Updates', description: 'When roadmap items change status or due date' },
  { key: 'contentComments', label: 'Comments on My Content', description: 'When someone comments on your devlogs or games' },
  { key: 'contentReactions', label: 'Reactions to My Content', description: 'When someone likes or reacts to your content' },
  { key: 'weeklyReports', label: 'Weekly Reports', description: 'Weekly summary of your account activity' },
  { key: 'marketingEmails', label: 'Marketing Emails', description: 'Product updates, promotions, and community news' },
];

function loadPrefs(): NotificationPreferences {
  if (typeof window === 'undefined') return defaultPrefs;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch {}
  return defaultPrefs;
}

function ToggleSwitch({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors ${
        checked
          ? 'border-cyan/60 bg-cyan/20'
          : 'border-border/50 bg-background/40'
      }`}
    >
      <span
        className={`inline-block size-4 transform rounded-full shadow-sm transition-transform duration-200 ${
          checked
            ? 'translate-x-[1.35rem] bg-cyan'
            : 'translate-x-[3px] bg-muted-foreground/40'
        }`}
      />
    </button>
  );
}

export default function NotificationsSettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences>(defaultPrefs);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    setPrefs(loadPrefs());
    setLoaded(true);
  }, []);

  const handleToggle = useCallback((key: keyof NotificationPreferences) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleSaveToBackend = async () => {
    setSaving(true);
    try {
      await api.patch('/users/me/cookie-preferences', {
        analytics: true,
        marketing: prefs.marketingEmails,
      });
      toast.success('Notification preferences saved.');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toast.error('Failed to save preferences to server. Preferences saved locally.');
      } else {
        toast.error('Failed to save preferences.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020609]">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

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

        <h1 className="mb-2 mt-6 font-display text-3xl font-black uppercase tracking-tight text-white">Notification Settings</h1>
        <SettingsNav />

        <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
          <div className="mb-4 flex items-center gap-3 border-b border-border/50 pb-3">
            <Bell className="size-5 text-cyan" />
            <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan">Notification Preferences</h2>
          </div>

          <div className="divide-y divide-border/30">
            {toggleDefs.map((def) => (
              <div key={def.key} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[0.6rem] uppercase tracking-widest text-foreground">{def.label}</p>
                  <p className="mt-0.5 font-mono text-[0.55rem] text-muted-foreground">{def.description}</p>
                </div>
                <ToggleSwitch
                  id={`toggle-${def.key}`}
                  checked={prefs[def.key]}
                  onChange={() => handleToggle(def.key)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="font-mono text-[0.55rem] text-muted-foreground">
            Preferences are saved locally.&nbsp;
            <button
              type="button"
              onClick={handleSaveToBackend}
              disabled={saving}
              className="cursor-pointer text-cyan underline underline-offset-2 hover:text-cyan/80 transition"
            >
              {saving ? 'Saving...' : 'Sync to server'}
            </button>
          </p>
          <button
            type="button"
            onClick={() => {
              setPrefs(defaultPrefs);
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPrefs));
              } catch {}
              toast.success('Preferences reset to defaults.');
            }}
            className="clip-corner inline-flex cursor-pointer items-center gap-2 border border-border/50 bg-background/30 px-4 py-2 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground transition hover:text-foreground"
          >
            <BellOff className="size-3.5" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
