'use client';

import type { ReactNode } from 'react';

export function BrandLoaderShell({ children, fadeOut }: { children: ReactNode; fadeOut: boolean }) {
  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-600 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{
        background: 'radial-gradient(circle at 50% 35%, rgba(62, 231, 255, 0.10), transparent 40%), radial-gradient(circle at 80% 20%, rgba(255, 87, 77, 0.12), transparent 30%), #02070b',
      }}
      role="status"
      aria-live="polite"
      aria-label="Loading PlayMorrow"
    >
      <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(62,231,255,0.06) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {children}
      <div className="pointer-events-none absolute left-4 top-4 size-8 border-l border-t border-border-bright/40" />
      <div className="pointer-events-none absolute right-4 top-4 size-8 border-r border-t border-border-bright/40" />
      <div className="pointer-events-none absolute bottom-4 left-4 size-8 border-b border-l border-border-bright/40" />
      <div className="pointer-events-none absolute bottom-4 right-4 size-8 border-b border-r border-border-bright/40" />
    </div>
  );
}
