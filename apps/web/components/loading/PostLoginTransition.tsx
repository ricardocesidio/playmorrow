'use client';

import { useState, useEffect, useRef } from 'react';
import { PlaymorrowLogo } from '@/components/brand/logo';
import { BrandLoaderShell } from './BrandLoaderShell';

export function PostLoginTransition({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const startRef = useRef(Date.now());
  const duration = 1200;

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
    }, 50);

    const timer = setTimeout(() => {
      setProgress(100);
      clearInterval(interval);
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => onDone(), 400);
      }, 200);
    }, duration);

    return () => { clearInterval(interval); clearTimeout(timer); };
  }, [onDone]);

  return (
    <BrandLoaderShell fadeOut={fadeOut}>
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="flex animate-[fadeScaleIn_0.8s_ease-out] flex-col items-center gap-2">
          <PlaymorrowLogo cutout size={40} className="drop-shadow-[0_0_20px_rgb(255_87_77_/_0.45)]" />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan/70">CONNECTING TO DASHBOARD</p>
        <div className="w-48 space-y-2">
          <div className="relative h-[2px] bg-border/40">
            <div className="absolute inset-y-0 left-0 bg-cyan transition-all duration-[100ms] ease-linear shadow-[0_0_8px_rgb(62_231_255_/_0.5)]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </BrandLoaderShell>
  );
}
