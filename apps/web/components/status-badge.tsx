interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  IN_DEVELOPMENT: 'border-amber/30 text-amber',
  ALPHA: 'border-violet/50 text-violet',
  PRE_ALPHA: 'border-amber/50 text-amber',
  BETA: 'border-cyan/50 text-cyan',
  RELEASED: 'border-cyan/30 text-cyan',
  CANCELLED: 'border-coral/30 text-coral',
  HIDDEN: 'border-border text-muted-foreground',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status] ?? 'border-border text-muted-foreground';
  const shouldFlicker = status === 'BETA';
  return (
    <span className={`inline-block rounded-none border bg-background/70 px-2 py-1 font-mono text-[10px] uppercase tracking-widest backdrop-blur-sm ${style} ${shouldFlicker ? 'animate-flicker' : ''}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
