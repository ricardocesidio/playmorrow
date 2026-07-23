import Link from 'next/link';

export function DashboardPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`clip-corner border border-border/90 bg-[#050b0f]/86 shadow-[0_18px_70px_rgb(0_0_0_/_0.36)] ${className}`}>
      {children}
    </div>
  );
}

export function SidebarLink({ href, icon, label, count, active }: { href: string; icon: React.ReactNode; label: string; count?: number; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 px-3 py-2.5 text-sm transition ${
        active ? 'border-r-2 border-cyan bg-cyan/10 text-foreground' : 'text-muted-foreground hover:bg-cyan/5 hover:text-foreground'
      }`}
    >
      <span className={active ? 'text-cyan' : 'text-muted-foreground group-hover:text-cyan'}>{icon}</span>
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="grid min-w-5 place-items-center border border-border bg-background px-1.5 py-0.5 font-mono text-[0.62rem] text-muted-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}
