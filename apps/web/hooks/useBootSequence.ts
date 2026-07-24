'use client';

import { useState, useEffect, useRef } from 'react';

export type VisitTier = 'first-ever' | 'returning-same-day' | 'returning-later';

const STORAGE_KEY = 'playmorrow:visit-history';
const MESSAGES = [
  'INITIALIZING SIGNAL',
  'SYNCING GAME INDEX',
  'CALIBRATING LIVE FEED',
  'CONNECTING STUDIOS',
  'PREPARING DASHBOARD',
  'SIGNAL LOCKED',
];

function getVisitTier(): VisitTier {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return 'first-ever';
    const ts = parseInt(stored, 10);
    const hoursSince = (Date.now() - ts) / 3_600_000;
    if (hoursSince < 24) return 'returning-same-day';
    return 'returning-later';
  } catch { return 'first-ever'; }
}

function getDuration(tier: VisitTier, reducedMotion: boolean): number {
  if (reducedMotion) return 100;
  switch (tier) {
    case 'first-ever': return 2200;
    case 'returning-same-day': return 1000;
    case 'returning-later': return 500;
  }
}

export function useBootSequence({ onComplete }: { onComplete: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<'boot' | 'done'>('boot');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('SCANNING NETWORK');
  const [fadeOut, setFadeOut] = useState(false);
  const startRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tier = getVisitTier();
    const duration = getDuration(tier, reduced);
    startRef.current = Date.now();

    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch { /* noop */ }

    let msgInterval: ReturnType<typeof setInterval> | null = null;
    if (!reduced && tier === 'first-ever') {
      let msgIdx = 0;
      msgInterval = setInterval(() => {
        msgIdx = (msgIdx + 1) % MESSAGES.length;
        setStatusText(MESSAGES[msgIdx]!);
      }, 1000);
    }

    const progInterval = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
    }, 50);

    const healthPromise = fetch('/api/health', { signal: AbortSignal.timeout(3000) }).catch(() => {});

    Promise.all([
      new Promise<void>((r) => setTimeout(r, duration)),
      healthPromise,
    ]).then(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      setProgress(100);
      setStatusText('SIGNAL LOCKED');
      if (msgInterval) clearInterval(msgInterval);
      clearInterval(progInterval);

      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setPhase('done');
          onComplete();
        }, reduced ? 50 : 400);
      }, reduced ? 0 : 200);
    });

    return () => { if (msgInterval) clearInterval(msgInterval); clearInterval(progInterval); };
  }, [onComplete]);

  return { phase, progress, statusText, fadeOut, mounted };
}
