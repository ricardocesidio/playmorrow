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
    <div className="flex flex-col items-center gap-3 border border-border bg-elevated py-16">
      {icon && <div className="text-muted-foreground/40">{icon}</div>}
      <p className="font-display text-lg font-semibold">{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Link
          href={action.href}
          className="mt-2 border border-coral bg-coral/10 px-4 py-2 font-mono text-xs uppercase tracking-widest text-coral transition-colors hover:bg-coral hover:text-coral-foreground"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
