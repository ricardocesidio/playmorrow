'use client';

import { useEffect, useRef } from 'react';

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    let raf: number;

    const handleMove = (e: MouseEvent) => {
      raf = requestAnimationFrame(() => {
        glow.style.setProperty('--cx', `${e.clientX}px`);
        glow.style.setProperty('--cy', `${e.clientY}px`);
      });
    };

    window.addEventListener('mousemove', handleMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background:
          'radial-gradient(600px circle at var(--cx, 50%) var(--cy, 50%), rgb(62 231 255 / 0.12), rgb(255 87 77 / 0.06) 40%, transparent 70%)',
      }}
    />
  );
}
