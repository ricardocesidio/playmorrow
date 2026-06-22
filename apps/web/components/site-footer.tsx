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
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
              <span className="grid size-8 place-items-center rounded-none bg-cyan/10 text-cyan">
                <LogoIcon className="size-4 text-cyan" />
              </span>
              <span>Playmorrow</span>
            </Link>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Discover tomorrow&apos;s indie games today. A curated platform for indie studios and game discoverability.
            </p>
          </div>

          {/* Navigate */}
          <div>
            <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">Navigate</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">Follow</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://instagram.com/playmorrow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 border-t border-border pt-6 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground/60">
          <p>&copy; {new Date().getFullYear()} Playmorrow. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
