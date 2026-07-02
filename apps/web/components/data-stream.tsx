'use client';

import { useEffect, useRef } from 'react';

const CHARS = 'アイウエオカキクケコサシスセソタチツテトABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>[]{}|/\\';
const FONT_SIZE = 12;
const COLUMNS_GAP = 1;

export function DataStream() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastScroll = window.scrollY;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const columns = Math.floor(canvas.width / (FONT_SIZE + COLUMNS_GAP));
    const drops: number[] = Array.from(
      { length: columns },
      () => (Math.random() * canvas.height) / FONT_SIZE,
    );

    const draw = () => {
      if (!ctx || !canvas) return;
      const scrollDelta = window.scrollY - lastScroll;
      lastScroll = window.scrollY;
      const speedMult = 1 + Math.abs(scrollDelta) * 0.04;

      ctx.fillStyle = 'rgba(2, 7, 11, 0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${FONT_SIZE}px monospace`;

      for (let i = 0; i < drops.length; i += 2) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)] ?? '0';
        const x = i * (FONT_SIZE + COLUMNS_GAP);
        const drop = drops[i];
        if (drop === undefined) continue;
        const y = drop * FONT_SIZE;

        ctx.fillStyle = 'rgba(62, 231, 255, 0.08)';
        ctx.fillText(char, x, y);

        if (y > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        } else {
          drops[i] = drop + speedMult * 0.5;
        }
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    const handleScroll = () => {
      lastScroll = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (typeof window === 'undefined') return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{ opacity: 0.35 }}
    />
  );
}
