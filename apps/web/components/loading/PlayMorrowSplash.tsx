'use client';

import { useBootSequence } from '@/hooks/useBootSequence';
import { PlaymorrowLogo } from '@/components/brand/logo';
import { BrandLoaderShell } from './BrandLoaderShell';

export function PlayMorrowSplash({ onDone }: { onDone: () => void }) {
  const { phase, progress, statusText, fadeOut } = useBootSequence({ onComplete: onDone });

  if (phase === 'done' && !fadeOut) return null;

  return (
    <BrandLoaderShell fadeOut={fadeOut}>
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="flex animate-[fadeScaleIn_1.2s_ease-out] flex-col items-center gap-2">
          <div style={{ animation: 'logoColorShift 3s ease-in-out forwards', color: 'rgb(255 87 77)', filter: 'drop-shadow(0 0 20px rgb(255 87 77 / 0.45))' }}>
            <PlaymorrowLogo cutout size={56} />
          </div>
          <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.5em] text-[#eef2f2] drop-shadow-[0_0_10px_rgb(255_255_255_/_0.12)]">PLAYMORROW</span>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan/70 animate-pulse">{statusText}</p>
        <div className="w-64 space-y-2">
          <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            <span>SIGNAL STRENGTH</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="relative h-[3px] bg-border/40">
            <div className="absolute inset-y-0 left-0 bg-cyan transition-all duration-[100ms] ease-linear shadow-[0_0_12px_rgb(62_231_255_/_0.7)]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/50">
        <span>34.0522° N, 118.2437° W</span>
        <span className="flex items-center gap-1.5">
          <span className={`size-1.5 rounded-none transition-colors duration-500 ${statusText === 'SIGNAL LOCKED' ? 'bg-success shadow-[0_0_8px_rgb(112_255_155_/_0.6)]' : 'bg-cyan/30'}`} />
          {statusText === 'SIGNAL LOCKED' ? 'CONNECTED' : 'SCANNING'}
        </span>
      </div>
    </BrandLoaderShell>
  );
}
