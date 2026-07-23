import Link from 'next/link';
import { LogoIcon } from './logo-icon';

export function SiteFooter() {
  return (
    <footer className="bg-black">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-8 lg:px-6">
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

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <Link href="/games" className="hover:text-foreground">Games</Link>
          <Link href="/studios" className="hover:text-foreground">Studios</Link>
          <Link href="/feed" className="hover:text-foreground">Feed</Link>
          <Link href="/search" className="hover:text-foreground">Search</Link>
          <a href="https://instagram.com/playmorrow" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Instagram</a>
          <a href="https://x.com/playmorrow" target="_blank" rel="noopener noreferrer" className="hover:text-foreground" aria-label="Follow PlayMorrow on X">X</a>
          <a href="https://discord.gg/playmorrow" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Discord</a>
          <a href="https://github.com/ricardocesidio/playmorrow" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">GitHub</a>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground/70">
          <Link href="/about" className="hover:text-foreground">About</Link>
          <Link href="/contact" className="hover:text-foreground">Contact</Link>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground/50">
          <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link href="/cookies" className="hover:text-foreground">Cookie Policy</Link>
          <Link href="/community-guidelines" className="hover:text-foreground">Community Guidelines</Link>
        </div>

        <div className="mt-4 border-t border-border/30 pt-4 text-center font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground/60">
          &copy; {new Date().getFullYear()} Playmorrow. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
