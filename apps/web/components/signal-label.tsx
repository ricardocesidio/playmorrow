import type { ReactNode } from 'react';

interface SignalLabelProps {
  children: ReactNode;
  color?: 'cyan' | 'coral' | 'violet' | 'amber' | 'muted';
}

const colorMap = {
  cyan: 'bg-cyan/10 text-cyan',
  coral: 'bg-coral/10 text-coral',
  violet: 'bg-violet/10 text-violet',
  amber: 'bg-amber/10 text-amber',
  muted: 'bg-muted text-muted-foreground',
};

const dotMap = {
  cyan: 'bg-cyan shadow-[0_0_6px_oklch(0.75_0.12_200_/_0.4)]',
  coral: 'bg-coral shadow-[0_0_6px_oklch(0.62_0.18_25_/_0.4)]',
  violet: 'bg-violet shadow-[0_0_6px_oklch(0.6_0.18_286_/_0.4)]',
  amber: 'bg-amber shadow-[0_0_6px_oklch(0.72_0.14_80_/_0.4)]',
  muted: 'bg-muted-foreground',
};

export function SignalLabel({ children, color = 'muted' }: SignalLabelProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-xs uppercase tracking-widest ${colorMap[color]}`}>
      <span className={`inline-block size-1.5 ${dotMap[color]}`} aria-hidden />
      {children}
    </span>
  );
}
