import Link from 'next/link';
import { LogoIcon } from './logo-icon';

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-8 lg:px-6">
        {/* Logo + tagline inline */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
            <LogoIcon className="size-5 text-coral" />
            <span>Playmorrow</span>
          </Link>
          <span className="hidden text-sm text-muted-foreground sm:inline">&mdash;</span>
          <p className="text-sm text-muted-foreground">
            Discover tomorrow&apos;s indie games today.
          </p>
        </div>

        {/* Links inline */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <Link href="/games" className="transition-colors hover:text-foreground">Games</Link>
          <Link href="/studios" className="transition-colors hover:text-foreground">Studios</Link>
          <Link href="/feed" className="transition-colors hover:text-foreground">Feed</Link>
          <Link href="/search" className="transition-colors hover:text-foreground">Search</Link>
          <a href="https://instagram.com/playmorrow" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">Instagram</a>
          <a href="https://x.com/playmorrow" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground" aria-label="Follow PlayMorrow on X">X</a>
        </div>

        {/* Legal links */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground/50">
          <Link href="/terms" className="transition-colors hover:text-foreground">Terms of Service</Link>
          <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy Policy</Link>
          <Link href="/cookies" className="transition-colors hover:text-foreground">Cookie Policy</Link>
          <Link href="/community-guidelines" className="transition-colors hover:text-foreground">Community Guidelines</Link>
        </div>

        {/* Copyright */}
        <div className="mt-4 border-t border-border pt-4 text-center font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground/60">
          &copy; {new Date().getFullYear()} Playmorrow. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
