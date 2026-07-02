import type { ReactNode } from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href: string };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 border border-border/60 bg-[#050b0f]/80 py-16 relative overflow-hidden animate-scan-top">
      <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground/50">
        <span className="animate-blink inline-block w-2 h-3 bg-cyan mr-2 align-middle shadow-[0_0_6px_rgb(62_231_255_/_0.5)]" aria-hidden />
        NO DATA DETECTED
      </p>
      {icon && <div className="text-muted-foreground/30">{icon}</div>}
      <p className="font-display text-lg font-semibold text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Link
          href={action.href}
          className="mt-2 clip-corner border border-coral bg-coral/10 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-coral shadow-[0_0_16px_rgb(255_87_77_/_0.1)] transition hover:bg-coral hover:text-coral-foreground hover:shadow-[0_0_24px_rgb(255_87_77_/_0.2)]"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
