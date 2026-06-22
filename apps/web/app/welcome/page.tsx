'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Gamepad2, Building2, Rss, ArrowRight, Check } from 'lucide-react';

import { useAuth } from '@/lib/api/auth-context';

const STEPS = [
  { icon: Building2, title: 'Create your studio', desc: 'Set up your studio profile with logo, description, and team.', href: '/studios/new' },
  { icon: Gamepad2, title: 'Publish a game', desc: 'Add your game with cover art, screenshots, tags, and platform links.', href: '/dashboard/games/new' },
  { icon: Rss, title: 'Write your first devlog', desc: 'Share development updates with rich text and images.', href: '/dashboard/devlogs/new' },
] as const;

export default function WelcomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
          <span className="font-display text-lg font-semibold tracking-tight">Playmorrow</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 py-16 text-center">
        <span className="grid size-16 place-items-center rounded-none bg-coral/10 text-coral">
          <Check className="size-8" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">Welcome to Playmorrow!</h1>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          Your account is ready. Here&apos;s how to get started:
        </p>

        <div className="mt-10 w-full space-y-4 text-left">
          {STEPS.map((step, i) => (
            <Link
              key={step.href}
              href={step.href}
              className="group flex items-center gap-5 border border-border bg-elevated p-5 transition-colors hover:border-border-bright"
            >
              <span className="flex size-12 shrink-0 items-center justify-center border border-border bg-background font-mono text-lg font-bold text-cyan">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <step.icon className="size-4 text-cyan" />
                  <p className="font-display font-semibold">{step.title}</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
              </div>
              <ArrowRight className="size-5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-cyan" />
            </Link>
          ))}
        </div>

        <div className="mt-10 flex gap-4">
          <Link href="/dashboard" className="border border-border px-6 py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">
            Go to dashboard
          </Link>
          <Link href="/games" className="border border-coral bg-coral/10 px-6 py-3 font-mono text-xs uppercase tracking-widest text-coral transition-colors hover:bg-coral hover:text-coral-foreground">
            Browse games
          </Link>
        </div>
      </main>
    </div>
  );
}
