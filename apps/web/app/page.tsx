import {
  Compass,
  GitBranch,
  ShieldCheck,
  Users,
  Sparkles,
  ArrowRight,
  Gamepad2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

const pillars = [
  {
    icon: Compass,
    title: 'Discovery',
    body: 'Help people find indie games early — long before launch day.',
  },
  {
    icon: GitBranch,
    title: 'Progress',
    body: 'Watch games evolve through devlogs, roadmaps, demos, and updates.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust',
    body: 'Structured profiles, press kits, and transparent project status.',
  },
  {
    icon: Users,
    title: 'Community',
    body: 'Follow, comment, react, ask questions, become an early supporter.',
  },
  {
    icon: Sparkles,
    title: 'Curation',
    body: 'Highlight quality projects — not just endless uploads.',
  },
];

const audiences = [
  {
    label: 'For studios',
    promise: 'Give your game a beautiful public home before launch.',
  },
  {
    label: 'For players',
    promise: 'Follow promising indie games from the moment they start becoming real.',
  },
  {
    label: 'For press & publishers',
    promise: 'Find serious indie projects with organized media, roadmaps, and studio info.',
  },
];

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Ambient gradient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_-10%,oklch(0.62_0.214_286_/_0.25),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />

      {/* Nav */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <a href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
            <Gamepad2 className="size-5" />
          </span>
          <span className="text-lg">Playmorrow</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a className="transition-colors hover:text-foreground" href="/explore">
            Explore
          </a>
          <a className="transition-colors hover:text-foreground" href="/studios">
            Studios
          </a>
          <a className="transition-colors hover:text-foreground" href="/devlogs">
            Devlogs
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <a href="/login">Sign in</a>
          </Button>
          <Button asChild size="sm">
            <a href="/studios/new">Create studio</a>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6">
        <section className="flex flex-col items-center py-20 text-center sm:py-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            The social discovery layer for indie games
          </div>

          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Discover{' '}
            <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              tomorrow&apos;s
            </span>{' '}
            indie games today.
          </h1>

          <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
            Follow indie studios, watch games evolve through devlogs and roadmaps, try early demos,
            and find the next project worth believing in.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href="/explore">
                Explore games
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="/studios/new">Create studio profile</a>
            </Button>
          </div>

          <p className="mt-10 max-w-xl text-sm text-muted-foreground/80">
            Steam is where people buy. itch.io is where people upload. Discord is where communities
            talk. <span className="text-foreground">Playmorrow is where studios build in public.</span>
          </p>
        </section>

        {/* Brand pillars */}
        <section className="grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-5">
          {pillars.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-xl border border-border bg-card/40 p-5 transition-colors hover:border-primary/40 hover:bg-card/70"
            >
              <span className="mb-4 grid size-10 place-items-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
                <Icon className="size-5" />
              </span>
              <h3 className="font-medium">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>

        {/* Audience promises */}
        <section className="grid gap-4 pb-24 md:grid-cols-3">
          {audiences.map(({ label, promise }) => (
            <div key={label} className="rounded-xl border border-border bg-card/30 p-6">
              <div className="text-xs font-medium uppercase tracking-wider text-primary">
                {label}
              </div>
              <p className="mt-3 text-pretty text-base">{promise}</p>
            </div>
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Gamepad2 className="size-4 text-primary" />
            <span>Playmorrow</span>
            <span className="text-muted-foreground/50">· v0.1</span>
          </div>
          <p>Discover tomorrow&apos;s indie games today.</p>
        </div>
      </footer>
    </div>
  );
}
