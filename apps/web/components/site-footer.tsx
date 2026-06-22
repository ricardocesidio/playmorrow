import Link from 'next/link';
import { LogoIcon } from './logo-icon';

const FOOTER_LINKS = [
  { href: '/games', label: 'Browse Games' },
  { href: '/studios', label: 'Studios' },
  { href: '/feed', label: 'Feed' },
  { href: '/search', label: 'Search' },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-10 lg:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <span className="grid size-8 place-items-center rounded-none bg-coral/10 text-coral">
            <LogoIcon className="size-4 text-coral" />
          </span>
          <span>Playmorrow</span>
        </Link>
        <p className="mt-2 max-w-xs text-center text-sm text-muted-foreground">
          Discover tomorrow&apos;s indie games today. A curated platform for indie studios and game discoverability.
        </p>

        {/* Navigate */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
          {FOOTER_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </Link>
          ))}
          <a
            href="https://instagram.com/playmorrow"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            Instagram
          </a>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground/60">
          &copy; {new Date().getFullYear()} Playmorrow. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
