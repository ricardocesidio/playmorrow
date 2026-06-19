interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  IN_DEVELOPMENT: 'border-amber/30 text-amber',
  RELEASED: 'border-cyan/30 text-cyan',
  CANCELLED: 'border-coral/30 text-coral',
  HIDDEN: 'border-border text-muted-foreground',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status] ?? 'border-border text-muted-foreground';
  return (
    <span className={`inline-block border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${style}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
