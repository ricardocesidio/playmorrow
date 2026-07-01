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
    <div className="relative min-h-screen bg-[#020609] flex flex-col">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
      
      <header className="relative border-b border-border/70">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
          <span className="font-display text-lg font-black uppercase tracking-tight text-white">Playmorrow</span>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 py-16 text-center">
        <span className="clip-corner grid size-16 place-items-center border border-coral/60 bg-coral/10 text-coral shadow-[0_0_20px_rgb(255_87_77_/_0.15)]">
          <Check className="size-8" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-black uppercase tracking-tight text-white">Welcome to Playmorrow!</h1>
        <p className="mt-3 max-w-md font-mono text-[0.6rem] text-muted-foreground">
          Your account is ready. Here&apos;s how to get started:
        </p>

        <div className="mt-10 w-full space-y-4 text-left">
          {STEPS.map((step, i) => (
            <Link
              key={step.href}
              href={step.href}
              className="clip-corner group flex items-center gap-5 border border-border/70 bg-[#050b0f]/80 p-5 shadow-[0_0_20px_rgb(0_0_0_/_0.25)] transition-colors hover:border-cyan/30"
            >
              <span className="clip-corner flex size-12 shrink-0 items-center justify-center border border-cyan/60 bg-[#050b0f]/50 font-mono text-lg font-bold text-cyan shadow-[0_0_14px_rgb(62_231_255_/_0.12)]">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <step.icon className="size-4 text-cyan" />
                  <p className="font-display font-semibold text-white">{step.title}</p>
                </div>
                <p className="mt-1 font-mono text-[0.6rem] text-muted-foreground">{step.desc}</p>
              </div>
              <ArrowRight className="size-5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-cyan" />
            </Link>
          ))}
        </div>

        <div className="mt-10 flex gap-4">
          <Link href="/dashboard" className="clip-corner border border-border/60 px-6 py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:border-cyan hover:text-cyan">
            Go to dashboard
          </Link>
          <Link href="/games" className="clip-corner border border-coral/60 bg-coral/10 px-6 py-3 font-mono text-xs uppercase tracking-widest text-coral shadow-[0_0_20px_rgb(255_87_77_/_0.15)] transition-colors hover:bg-coral hover:text-background">
            Browse games
          </Link>
        </div>
      </main>
    </div>
  );
}
