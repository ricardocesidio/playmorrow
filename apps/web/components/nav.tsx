'use client';

import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
      <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
          <Gamepad2 className="size-5" />
        </span>
        <span className="text-lg">Playmorrow</span>
      </Link>
      <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
        <Link
          href="/games"
          className={`transition-colors hover:text-foreground ${pathname === '/games' ? 'text-foreground' : ''}`}
        >
          Games
        </Link>
      </nav>
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/studios/new">Create studio</Link>
        </Button>
      </div>
    </header>
  );
}
