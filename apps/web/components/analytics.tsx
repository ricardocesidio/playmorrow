'use client';

import { useEffect } from 'react';

const STORAGE_KEY = 'playmorrow-cookies';
const PLAUSIBLE_URL = process.env.NEXT_PUBLIC_PLAUSIBLE_URL || 'https://plausible.io';
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || 'playmorrow.vercel.app';

export function Analytics() {
  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const consent = raw ? JSON.parse(raw) : null;
    if (!consent?.analytics) return;

    const script = document.createElement('script');
    script.src = `${PLAUSIBLE_URL}/js/script.js`;
    script.setAttribute('data-domain', PLAUSIBLE_DOMAIN);
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
}
