'use client';

import { useCallback, useRef } from 'react';

const PREF_KEY = 'playmorrow:sound-muted';

const SOUND_FILES: Record<string, string> = {
  // Audio files to be added later:
  // 'login': '/sounds/login-confirm.mp3',
  // 'signal-lock': '/sounds/signal-lock.mp3',
};

export function useUiSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const isMuted = (): boolean => {
    try { return localStorage.getItem(PREF_KEY) === '1'; } catch { return false; }
  };

  const setMuted = (muted: boolean) => {
    try { localStorage.setItem(PREF_KEY, muted ? '1' : '0'); } catch { /* noop */ }
  };

  const play = useCallback((key: string) => {
    if (isMuted()) return;
    const src = SOUND_FILES[key];
    if (!src) return;
    try {
      const audio = new Audio(src);
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch { /* noop */ }
  }, []);

  return { play, isMuted, setMuted, availableKeys: Object.keys(SOUND_FILES) };
}
