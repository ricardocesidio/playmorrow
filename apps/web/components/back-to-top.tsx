'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!visible) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 grid size-10 cursor-pointer place-items-center border border-cyan/50 bg-background/80 text-cyan shadow-[0_0_16px_rgb(62_231_255_/_0.2)] backdrop-blur-sm transition hover:bg-cyan hover:text-background"
      aria-label="Back to top"
    >
      <ArrowUp className="size-4" />
    </button>
  );
}
