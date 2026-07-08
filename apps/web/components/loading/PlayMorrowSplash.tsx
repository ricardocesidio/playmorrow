'use client';

import { useState, useEffect, useRef } from 'react';

const BOOT_MESSAGES = [
  'INITIALIZING SIGNAL',
  'SYNCING GAME INDEX',
  'CALIBRATING LIVE FEED',
  'CONNECTING STUDIOS',
  'PREPARING DASHBOARD',
  'SIGNAL LOCKED',
];

const MIN_SPLASH_MS = 5000;
const MAX_SPLASH_MS = 8000;
const STORAGE_KEY = 'playmorrow:splash-seen';

export function PlayMorrowSplash({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState<number>(0);
  const [_msgIndex, setMsgIndex] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('SCANNING NETWORK');
  const [fadeOut, setFadeOut] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    // Message rotation every 1s
    const msgInterval = setInterval(() => {
      setMsgIndex((i) => {
        const next = (i + 1) % BOOT_MESSAGES.length;
        setStatusText(BOOT_MESSAGES[next]!);
        return next;
      });
    }, 1000);

    // Progress bar: 0→100% over MIN_SPLASH_MS
    const progInterval = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(100, (elapsed / MIN_SPLASH_MS) * 100);
      setProgress(pct);
    }, 50);

    // Minimum duration + optional health check
    const minTimer = new Promise<void>((resolve) => setTimeout(resolve, MIN_SPLASH_MS));
    const maxTimer = new Promise<void>((resolve) => setTimeout(resolve, MAX_SPLASH_MS));

    async function boot() {
      // Try health check (lightweight, timeout after 3s)
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 3000);
        await fetch('/api/health', { signal: controller.signal });
        clearTimeout(tid);
      } catch {
        // Backend unavailable — continue silently
      }
    }

    Promise.race([
      Promise.all([minTimer, boot()]),
      maxTimer,
    ]).then(() => {
      setProgress(100);
      setStatusText('SIGNAL LOCKED');
      clearInterval(msgInterval);
      clearInterval(progInterval);

      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setVisible(false);
          try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch { /* noop */ }
          onDone();
        }, 600);
      }, 400);
    });

    return () => { clearInterval(msgInterval); clearInterval(progInterval); };
  }, [onDone]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-600 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(circle at 50% 35%, rgba(62, 231, 255, 0.10), transparent 40%), radial-gradient(circle at 80% 20%, rgba(255, 87, 77, 0.12), transparent 30%), #03070d',
      }}
      role="status"
      aria-live="polite"
      aria-label="Loading PlayMorrow"
    >
      {/* Scanlines overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(62,231,255,0.03)_2px,rgba(62,231,255,0.03)_4px)]" />

      {/* Animated grid */}
      <div className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(62,231,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(62,231,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Glow orbs */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 size-64 rounded-full border border-cyan/5" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 size-48 rounded-full border border-coral/5" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex animate-[fadeScaleIn_1.2s_ease-out] flex-col items-center gap-2">
          <svg viewBox="0 0 40 40" className="size-14 text-coral drop-shadow-[0_0_20px_rgb(255_87_77_/_0.45)]" aria-hidden="true">
            <path fill="currentColor" d="M5 4h21.2L35 12.8v7.1L25.4 29.5H13.2V36H5V22.5h17l5.3-5.3v-1.7L22 10.2H5V4Z" />
            <path fill="#03070d" d="M5 14.2h14.5l3.5 3.5-3.5 3.5H5v-7Z" />
          </svg>
          <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.5em] text-[#eef2f2] drop-shadow-[0_0_10px_rgb(255_255_255_/_0.12)]">
            PLAYMORROW
          </span>
        </div>

        {/* Status message */}
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan/70 animate-pulse">
          {statusText}
        </p>

        {/* Progress bar */}
        <div className="w-64 space-y-2">
          <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            <span>SIGNAL STRENGTH</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="relative h-[3px] bg-border/40">
            <div
              className="absolute inset-y-0 left-0 bg-cyan transition-all duration-[100ms] ease-linear shadow-[0_0_12px_rgb(62_231_255_/_0.7)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/50">
        <span>34.0522° N, 118.2437° W</span>
        <span className="flex items-center gap-1.5">
          <span className={`size-1.5 rounded-none transition-colors duration-500 ${progress >= 100 ? 'bg-success shadow-[0_0_8px_rgb(112_255_155_/_0.6)]' : 'bg-cyan/30'}`} />
          {progress >= 100 ? 'CONNECTED' : 'SCANNING'}
        </span>
      </div>

      {/* Corner frames */}
      <div className="pointer-events-none absolute left-4 top-4 size-8 border-l border-t border-border-bright/40" />
      <div className="pointer-events-none absolute right-4 top-4 size-8 border-r border-t border-border-bright/40" />
      <div className="pointer-events-none absolute bottom-4 left-4 size-8 border-b border-l border-border-bright/40" />
      <div className="pointer-events-none absolute bottom-4 right-4 size-8 border-b border-r border-border-bright/40" />
    </div>
  );
}
