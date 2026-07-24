'use client';

import { useEffect, useState } from 'react';
import { PlaymorrowLogo } from './logo';

interface AnimatedPlaymorrowLogoProps {
  className?: string;
  size?: number;
  cutout?: boolean;
  segmented?: boolean;
  onReady?: () => void;
}

export function AnimatedPlaymorrowLogo({ className = '', size = 56, cutout = true, segmented = true, onReady }: AnimatedPlaymorrowLogoProps) {
  const [phase, setPhase] = useState<'hidden' | 'fade-in' | 'glitch' | 'settled'>('hidden');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fade-in'), 50);
    const t2 = setTimeout(() => setPhase('glitch'), 800);
    const t3 = setTimeout(() => {
      setPhase('settled');
      onReady?.();
    }, 1200);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onReady]);

  return (
    <div className={`relative ${className}`}>
      <div
        style={{
          opacity: phase === 'hidden' ? 0 : 1,
          transform: `scale(${phase === 'hidden' ? 0.8 : 1})`,
          transition: 'opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <PlaymorrowLogo cutout={cutout} size={size} />
      </div>
      {segmented && phase === 'glitch' && (
        <div
          className="absolute inset-0"
          style={{
            animation: 'glitchRGB 0.3s ease-in-out',
            mixBlendMode: 'screen',
          }}
        >
          <PlaymorrowLogo cutout size={size} />
        </div>
      )}
    </div>
  );
}
