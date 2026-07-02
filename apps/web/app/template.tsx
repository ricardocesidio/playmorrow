'use client';

import type { ReactNode } from 'react';

export default function PageTemplate({ children }: { children: ReactNode }) {
  return (
    <div className="animate-glitch-sparse">
      {children}
    </div>
  );
}
