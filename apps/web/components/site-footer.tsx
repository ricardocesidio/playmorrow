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
        </div>

        {/* Copyright */}
        <div className="mt-4 border-t border-border pt-4 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground/60">
          &copy; {new Date().getFullYear()} Playmorrow. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
