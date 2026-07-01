'use client';

import { useState, useEffect } from 'react';
import { X, Cookie, Shield, BarChart3, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api/client';

interface ConsentSettings {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  acceptedAt: string;
}

const STORAGE_KEY = 'playmorrow-cookies';

function getConsent(): ConsentSettings | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveConsent(settings: Omit<ConsentSettings, 'acceptedAt'>) {
  const data = { ...settings, acceptedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  // Save to backend (fire-and-forget)
  api.patch('/users/me/cookie-preferences', { analytics: settings.analytics, marketing: settings.marketing }).catch(() => {});
}

const cookieTypes = [
  { id: 'essential', label: 'Essential', desc: 'Session management, authentication, security. Always active.', icon: Shield, required: true },
  { id: 'analytics', label: 'Analytics', desc: 'Page views, feature usage, crash reports. Helps us improve.', icon: BarChart3 },
  { id: 'marketing', label: 'Marketing', desc: 'Personalized recommendations and promotional content.', icon: Megaphone },
];

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [prefs, setPrefs] = useState({ analytics: false, marketing: false });

  useEffect(() => {
    const saved = getConsent();
    if (!saved) {
      setTimeout(() => setVisible(true), 1000);
    } else {
      setPrefs({ analytics: saved.analytics, marketing: saved.marketing });
    }
  }, []);

  const acceptAll = () => {
    saveConsent({ essential: true, analytics: true, marketing: true });
    setPrefs({ analytics: true, marketing: true });
    setVisible(false);
  };

  const rejectAll = () => {
    saveConsent({ essential: true, analytics: false, marketing: false });
    setPrefs({ analytics: false, marketing: false });
    setVisible(false);
  };

  const saveCustom = () => {
    saveConsent({ essential: true, analytics: prefs.analytics, marketing: prefs.marketing });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4">
      <div className="mx-auto max-w-5xl">
        <div className="clip-corner border border-border/70 bg-[#050b0f]/98 p-5 shadow-[0_0_60px_rgb(0_0_0_/_0.6)] backdrop-blur-xl sm:p-6">
          {!customizing ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex size-12 shrink-0 items-center justify-center border border-cyan/30 bg-cyan/5">
                <Cookie className="size-6 text-cyan" />
              </div>
              <div className="flex-1">
                <p className="font-display text-base font-bold text-white">This site uses cookies</p>
                <p className="mt-1.5 font-mono text-[0.6rem] leading-relaxed text-muted-foreground">
                  We use cookies and similar technologies to improve your experience, analyze traffic, and personalize content.
                  Essential cookies are always active. You can customize your preferences.
                </p>
                <Link href="/cookies" className="mt-2 inline-block font-mono text-[0.55rem] uppercase tracking-widest text-cyan underline hover:text-white transition">
                  Learn more in our Cookie Policy
                </Link>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 pt-1">
                <button onClick={customizing ? saveCustom : acceptAll}
                  className="clip-corner cursor-pointer border border-cyan bg-cyan/10 px-5 py-2.5 font-mono text-[0.6rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background">
                  Accept all
                </button>
                <button onClick={() => setCustomizing(true)}
                  className="clip-corner cursor-pointer border border-border/60 px-5 py-2.5 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan hover:text-cyan">
                  Customize
                </button>
                <button onClick={rejectAll}
                  className="clip-corner cursor-pointer border border-border/40 px-5 py-2.5 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground/50 transition hover:text-coral">
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="font-display text-base font-bold text-white">Cookie Preferences</p>
                <button onClick={() => setCustomizing(false)} className="cursor-pointer text-muted-foreground hover:text-foreground">
                  <X className="size-5" />
                </button>
              </div>
              <div className="space-y-3">
                {cookieTypes.map((ct) => {
                  const Icon = ct.icon;
                  const checked = ct.required ? true : (ct.id === 'analytics' ? prefs.analytics : prefs.marketing);
                  return (
                    <div key={ct.id} className="flex items-start gap-3 border-b border-border/40 pb-3 last:border-0">
                      <Icon className="mt-0.5 size-4 shrink-0 text-cyan" />
                      <div className="flex-1">
                        <p className="font-mono text-[0.6rem] font-semibold text-foreground">
                          {ct.label} {ct.required && <span className="text-muted-foreground/50">(required)</span>}
                        </p>
                        <p className="mt-0.5 font-mono text-[0.55rem] text-muted-foreground">{ct.desc}</p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input type="checkbox" checked={checked} disabled={ct.required}
                          onChange={() => {
                            if (ct.id === 'analytics') setPrefs(p => ({ ...p, analytics: !p.analytics }));
                            if (ct.id === 'marketing') setPrefs(p => ({ ...p, marketing: !p.marketing }));
                          }}
                          className="peer sr-only" />
                        <div className="h-5 w-9 rounded-none border border-border bg-background after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:border after:border-border after:bg-muted-foreground after:transition-all peer-checked:border-cyan peer-checked:bg-cyan/20 peer-checked:after:translate-x-full peer-checked:after:border-cyan peer-checked:after:bg-cyan" />
                      </label>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={saveCustom}
                  className="clip-corner cursor-pointer border border-cyan bg-cyan/10 px-5 py-2.5 font-mono text-[0.6rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background">
                  Save preferences
                </button>
                <button onClick={acceptAll}
                  className="clip-corner cursor-pointer border border-border/60 px-5 py-2.5 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan hover:text-cyan">
                  Accept all
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
