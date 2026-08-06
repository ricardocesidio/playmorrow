import type { ReactNode } from 'react';

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-cyan/10 px-2.5 py-0.5 text-xs text-cyan">
      {children}
    </span>
  );
}
