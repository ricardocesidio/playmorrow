'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Globe, Monitor, Gamepad2, Clipboard } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { HudPanel, CircuitFrame, HudStatusRail } from '@/components/playmorrow/hud';
import { useGame, useGameRoadmap } from '@/lib/api/hooks';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { ErrorState } from '@/components/error-state';

const fallbackFeatures = [
  'Plan your approach with deep tactical tools.',
  'Use gadgets, hacking, and the environment to stay unseen.',
  'Dynamic AI that adapts to your every move.',
  'A living cyberpunk world with reactive systems.',
];

export default function GameReadmePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: game, isLoading, error } = useGame(slug);
  const { data: roadmap } = useGameRoadmap(slug);

  if (isLoading) {
    return (
      <>
        <SiteHeader />
        <main className="relative min-h-screen px-5 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-4xl">
            <LoadingSkeleton count={6} height="h-16" />
          </div>
        </main>
      </>
    );
  }

  if (error || !game) {
    return (
      <>
        <SiteHeader />
        <main className="relative min-h-screen px-5 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-4xl">
            <ErrorState message="Game not found." />
            <div className="mt-4 text-center">
              <Link href="/games" className="pm-micro text-cyan underline">Back to games</Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const title = game.title;
  const heroImage = game.bannerUrl || game.coverUrl || '/playmorrow/neon-warden.png';
  const readmeLines = game.readme
    ? game.readme.split('\n')
    : (game.description
      ? game.description.split('\n')
      : [`${title.toUpperCase()} is a tactical stealth game set in a dystopian cyberpunk city where corporate control and surveillance dictate every move.`]);
  const roadmapItems = roadmap ?? [];
  const platforms = game.platformLinks?.length
    ? game.platformLinks
    : [];

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen overflow-hidden px-5 pb-24 pt-3 sm:px-8 lg:px-10">
        <CircuitFrame className="opacity-65" />
        <div className="relative z-10 mx-auto max-w-4xl">
          {/* Breadcrumb */}
          <nav className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link href={`/games/${slug}`} className="inline-flex items-center gap-1 transition hover:text-cyan">
              <ArrowLeft className="size-3" /> Back to {title}
            </Link>
            <span>/</span>
            <Link href="/games" className="transition hover:text-cyan">Games</Link>
            <span>/</span>
            <span className="text-foreground/70">{title}</span>
            <span>/</span>
            <span className="text-cyan">Readme</span>
          </nav>

          {/* Hero background */}
          <div className="relative mb-8 overflow-hidden rounded border border-border/60">
            <img src={heroImage} alt={`${title} hero`} className="h-48 w-full object-cover sm:h-64" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <p className="pm-micro text-cyan mb-1">README</p>
              <h1 className="font-display text-3xl font-black uppercase text-foreground drop-shadow-[0_4px_12px_rgb(0_0_0_/_0.85)]">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">by {game.studio.name}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="space-y-6">
              {/* Full readme content */}
              <HudPanel className="p-6" accent="muted">
                <h2 className="pm-micro text-foreground mb-4">About</h2>
                <div className="space-y-3 text-xs leading-6 text-muted-foreground">
                  {readmeLines.map((line, index) => (
                    line.trim() ? (
                      <p key={index}>{line}</p>
                    ) : (
                      <br key={index} />
                    )
                  ))}
                </div>
              </HudPanel>

              {/* Features */}
              <HudPanel className="p-6" accent="muted">
                <h2 className="pm-micro text-foreground mb-4">Features</h2>
                <ul className="grid gap-2 text-xs text-muted-foreground">
                  {fallbackFeatures.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-cyan shadow-[0_0_8px_rgb(62_231_255_/_0.8)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </HudPanel>

              {/* Roadmap */}
              {roadmapItems.length > 0 && (
                <HudPanel className="p-6" accent="muted">
                  <h2 className="pm-micro text-foreground mb-4">Roadmap</h2>
                  <div className="space-y-3">
                    {roadmapItems.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 border-b border-border/45 pb-3 last:border-b-0">
                        <span className={`mt-1 size-2 shrink-0 rounded-full ${
                          item.status === 'DONE' ? 'bg-success shadow-[0_0_8px_rgb(112_255_155_/_0.6)]' :
                          item.status === 'IN_PROGRESS' ? 'bg-cyan shadow-[0_0_8px_rgb(62_231_255_/_0.6)]' :
                          'bg-muted-foreground/30'
                        }`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{item.title}</p>
                          {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                          {item.targetDate && (
                            <p className="text-xs text-muted-foreground/60 mt-1">
                              Target: {new Date(item.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                        <span className={`ml-auto shrink-0 text-xs uppercase ${
                          item.status === 'DONE' ? 'text-success' :
                          item.status === 'IN_PROGRESS' ? 'text-cyan' :
                          'text-muted-foreground/50'
                        }`}>
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </HudPanel>
              )}
            </div>

            <aside className="space-y-4">
              {/* Platforms */}
              <HudPanel className="p-4" accent="muted">
                <h2 className="pm-micro text-foreground mb-3">Platforms</h2>
                {platforms.length > 0 ? (
                  <div className="space-y-2">
                    {platforms.map((p) => (
                      <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded border border-border bg-background/55 px-3 py-2 text-xs text-muted-foreground transition hover:border-cyan hover:text-cyan"
                      >
                        {p.platform.includes('PC') || p.platform === 'STEAM' || p.platform === 'ITCH' || p.platform === 'EPIC' || p.platform === 'GOG'
                          ? <Monitor className="size-3.5" />
                          : <Gamepad2 className="size-3.5" />
                        }
                        {p.label || p.platform}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No platform links yet.</p>
                )}
              </HudPanel>

              {/* Demo/Playtest status */}
              <HudPanel className="p-4" accent="muted">
                <h2 className="pm-micro text-foreground mb-3">Demo / Playtest</h2>
                <p className="text-xs text-muted-foreground">
                  {game.demoUrl
                    ? <a href={game.demoUrl} target="_blank" rel="noopener noreferrer" className="text-cyan underline">Demo available</a>
                    : 'No demo available yet'}
                </p>
              </HudPanel>

              {/* External Links */}
              <HudPanel className="p-4" accent="muted">
                <h2 className="pm-micro text-foreground mb-3">External Links</h2>
                <div className="grid gap-2">
                  {[
                    { label: 'Press Kit', href: `/games/${slug}/press-kit`, Icon: Clipboard },
                    { label: 'Contact Studio', href: '/login', Icon: Globe },
                  ].map(({ label, href, Icon }) => (
                    <Link key={label} href={href}
                      className="flex items-center gap-2 rounded border border-border bg-background/55 px-3 py-2 text-xs text-muted-foreground transition hover:border-cyan hover:text-cyan"
                    >
                      <Icon className="size-3.5" /> {label}
                    </Link>
                  ))}
                </div>
              </HudPanel>
            </aside>
          </div>

          {/* Back to game */}
          <div className="mt-8 text-center">
            <Link href={`/games/${slug}`}
              className="inline-flex items-center gap-2 text-sm text-cyan hover:underline"
            >
              <ArrowLeft className="size-4" /> Back to {title}
            </Link>
          </div>
        </div>
        <HudStatusRail />
      </main>
    </>
  );
}
