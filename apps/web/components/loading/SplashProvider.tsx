'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { PlayMorrowSplash } from './PlayMorrowSplash';

const STORAGE_KEY = 'playmorrow:splash-seen';

export function SplashProvider({ children }: { children: ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const seen = sessionStorage.getItem(STORAGE_KEY);
    if (seen) {
      setShowSplash(false);
    }
  }, []);

  if (!hydrated) {
    // SSR: render children hidden behind splash (never visible on server)
    return (
      <>
        <div style={{ display: 'none' }}>{children}</div>
      </>
    );
  }

  return (
    <>
      {showSplash && (
        <PlayMorrowSplash onDone={() => setShowSplash(false)} />
      )}
      {/* Render children underneath splash to avoid layout shift */}
      <div style={{ display: showSplash ? 'none' : '' }}>{children}</div>
    </>
  );
}
