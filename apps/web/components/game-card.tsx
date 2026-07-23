'use client';

import Link from 'next/link';
import { ArrowRight, Bookmark, Heart, Users, Zap } from 'lucide-react';
import { formatFollowers, formatRelativeTime } from '@/lib/format';
import type { Game } from '@/lib/api/client';
import { StatusBadge } from './status-badge';
import { HudPanel } from '@/components/playmorrow/hud';

type GameCardVariant = 'default' | 'featured' | 'compact' | 'studio';

export function GameCard({ game, variant = 'default' }: { game: Game; variant?: GameCardVariant }) {
  switch (variant) {
    case 'featured':
      return <FeaturedCard game={game} />;
    case 'compact':
      return <CompactCard game={game} />;
    case 'studio':
      return <StudioDashboardCard game={game} />;
    default:
      return <DefaultCard game={game} />;
  }
}

function DefaultCard({ game }: { game: Game }) {
  const cover = game.coverUrl || '/demo/games/neon-warden/hero.svg';
  const progress = game.progressPercent ?? null;
  const accent = statusAccent(game.status);

  return (
    <Link
      href={`/games/${game.slug}`}
      className="group panel relative flex min-h-[228px] flex-col overflow-hidden border-border/90 bg-[linear-gradient(135deg,rgb(62_231_255_/_0.06),rgb(166_92_255_/_0.04),rgb(255_87_77_/_0.03))] shadow-[0_20px_80px_rgb(0_0_0_/_0.6),0_0_30px_rgb(62_231_255_/_0.05),inset_0_1px_0_rgb(255_255_255_/_0.02)] transition duration-200 hover:border-cyan/70 hover:shadow-[0_0_32px_rgb(62_231_255_/_0.14),0_20px_80px_rgb(0_0_0_/_0.7)]"
    >
      <div className="relative aspect-[1.82] overflow-hidden bg-muted">
        <img
          src={cover}
          alt={game.title}
          className="img-glitch-hover size-full object-cover transition duration-300 group-hover:scale-[1.035]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/28 to-transparent" />
        <div className="absolute left-3 top-3">
          <StatusBadge status={game.status} />
        </div>
        <span className="signal-dot absolute right-3 top-3" aria-hidden />
        <button
          type="button"
          aria-label={`Save ${game.title}`}
          className="absolute bottom-3 right-3 grid size-8 place-items-center border border-border-bright/70 bg-background/70 text-muted-foreground backdrop-blur-sm transition group-hover:border-cyan group-hover:text-cyan"
          onClick={(event) => event.preventDefault()}
        >
          <Bookmark className="size-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col border-t border-border/80 p-3">
        <h3 className="font-display text-[1.45rem] font-black uppercase leading-none text-foreground transition-colors group-hover:text-cyan">
          {game.title}
        </h3>

        {game.studio && (
          <p className="pm-micro mt-3 text-muted-foreground">
            {game.studio.name}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {(game.tags?.length ? game.tags : ['Indie']).slice(0, 2).map((tag, index) => (
            <span key={tag}>{index > 0 ? '• ' : ''}{tag}</span>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-cyan">
          <Users className="size-3.5" />
          <span>{formatFollowers(game.followersCount)} followers</span>
        </div>

        <div className="mt-auto pt-4">
          <div className="mb-1 flex items-center justify-between pm-micro text-muted-foreground">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 bg-border">
            <div
              className={`h-full ${accent.bar} shadow-[0_0_10px_currentColor]`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {[...new Set(game.platformLinks?.length ? game.platformLinks.map((p) => p.platform) : ['PC', 'PS5', 'XBOX'])].slice(0, 4).map((platform) => (
            <span key={platform} className="border border-border px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground">
              {platform}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

function statusAccent(status: string) {
  if (status === 'ALPHA') return { bar: 'bg-violet text-violet' };
  if (status === 'PRE_ALPHA') return { bar: 'bg-amber text-amber' };
  return { bar: 'bg-cyan text-cyan' };
}

function FeaturedCard({ game }: { game: Game }) {
  const cover = game.coverUrl || '/demo/games/neon-warden/hero.svg';
  return (
    <Link href={`/games/${game.slug}`} className="block cursor-pointer">
      <HudPanel className="relative min-h-[438px] overflow-hidden p-6 sm:p-7 transition hover:border-cyan/70" accent="muted">
        <img src={cover} alt={game.title} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/56 to-background/6" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/92 via-transparent to-background/20" />
        <div className="relative z-10 grid min-h-[386px] content-between">
          <div>
            <StatusBadge status={game.status} />
            <h2 className="mt-5 font-display text-5xl font-black uppercase leading-none text-foreground sm:text-[3.55rem]">{game.title}</h2>
            <p className="pm-micro mt-5 text-muted-foreground">{(game.tags ?? []).slice(0, 2).join(' • ')}</p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">{game.tagline ?? ''}</p>
          </div>
          <div className="grid gap-4 xl:grid-cols-[0.72fr_1fr]">
            <div>
              <div className="flex items-center gap-4 border-t border-border/80 pt-3">
                <div className="grid size-12 place-items-center border border-border-bright bg-background/70">
                  <Zap className="size-6 text-foreground" />
                </div>
                <div>
                  <p className="pm-display text-sm text-foreground">{game.studio?.name ?? 'Independent Studio'} <span className="text-cyan">●</span></p>
                  <p className="text-xs text-muted-foreground">{(game.tags ?? [])[0] ?? ''}</p>
                </div>
              </div>
              <p className="mt-4 flex items-center gap-2 text-lg text-cyan"><Users className="size-5" /> {formatFollowers(game.followersCount)} followers</p>
            </div>
            <div className="clip-corner border border-border bg-background/70 p-4 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between gap-4">
                <span className="pm-micro text-foreground">Status</span>
                <span className="pm-micro inline-flex items-center gap-2 text-cyan">
                  View game <ArrowRight className="size-3" />
                </span>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={game.status} />
                {game.expectedReleaseText && (
                  <span className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                    Expected: {game.expectedReleaseText}
                  </span>
                )}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="border border-border/50 px-2 py-2">
                  <p className="font-display text-lg font-black text-cyan">{formatFollowers(game.followersCount)}</p>
                  <p className="font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground">Followers</p>
                </div>
                {game.wishlistsCount != null && (
                  <div className="border border-border/50 px-2 py-2">
                    <p className="font-display text-lg font-black text-coral">{game.wishlistsCount}</p>
                    <p className="font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground">Wishlists</p>
                  </div>
                )}
                {game.commentsCount != null && (
                  <div className="border border-border/50 px-2 py-2">
                    <p className="font-display text-lg font-black text-violet">{game.commentsCount}</p>
                    <p className="font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground">Comments</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </HudPanel>
    </Link>
  );
}

function CompactCard({ game }: { game: Game }) {
  const cover = game.coverUrl || '/demo/games/neon-warden/hero.svg';
  return (
    <Link href={`/games/${game.slug}`} className="group grid min-h-[260px] overflow-hidden border border-border bg-card transition hover:border-cyan/70">
      <div className="relative min-h-[180px] p-4">
        <img src={cover} alt={game.title} className="img-glitch-hover absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.035]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/86 via-background/42 to-transparent" />
        <div className="relative z-10">
          <StatusBadge status={game.status} />
          <h3 className="mt-6 font-display text-4xl font-black uppercase leading-none text-foreground">{game.title}</h3>
          <p className="mt-4 text-xs text-muted-foreground">{(game.tags ?? []).join(' • ')}</p>
          <p className="mt-4 max-w-[250px] text-sm leading-6 text-muted-foreground">{game.tagline ?? 'No description available'}</p>
        </div>
      </div>
      <div className="border-t border-border bg-background/50 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="pm-micro text-foreground">{game.studio?.name ?? 'Independent Studio'}</span>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="size-3 text-cyan" /> {formatFollowers(game.followersCount)}</span>
            {game.wishlistsCount != null && <span className="flex items-center gap-1"><Heart className="size-3 text-coral" /> {game.wishlistsCount}</span>}
          </div>
        </div>
        {game.expectedReleaseText && (
          <p className="mt-2 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Expected: {game.expectedReleaseText}</p>
        )}
      </div>
    </Link>
  );
}

function StudioDashboardCard({ game }: { game: Game }) {
  const cover = game.coverUrl || game.bannerUrl || '/demo/games/neon-warden/hero.svg';
  const progress = game.progressPercent ?? statusBasedProgress(game.status);
  return (
    <Link href={`/games/${game.slug}`} className="group overflow-hidden border border-border/90 bg-background/70 transition hover:-translate-y-0.5 hover:border-cyan/70">
      <div className="relative aspect-[1.2/1] overflow-hidden">
        <img src={cover} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
        <span className="absolute right-2 top-2 border border-coral/60 bg-coral/15 px-2 py-1 font-mono text-[0.55rem] uppercase text-coral">{formatStatusLabel(game.status)}</span>
        <div className="absolute inset-x-3 bottom-3">
          <h3 className="font-display text-xl uppercase leading-none text-white">{game.title}</h3>
          <p className="mt-1 text-[0.68rem] text-muted-foreground">{game.tags?.[0] ?? game.genres ?? 'Studio Project'}</p>
        </div>
      </div>
      <div className="space-y-2 p-3">
        <div className="grid grid-cols-3 gap-2 font-mono text-[0.58rem] text-muted-foreground">
          <span>{formatNumber(game.followersCount)} followers</span>
          <span>{formatNumber(game.viewsCount ?? 0)} views</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-border">
          <div className="h-full bg-cyan shadow-[0_0_12px_rgb(62_231_255_/_0.55)]" style={{ width: `${progress}%` }} />
        </div>
        <p className="truncate text-[0.68rem] text-muted-foreground">
          Updated {formatRelativeTime(game.updatedAt)}
        </p>
      </div>
    </Link>
  );
}

function formatStatusLabel(status: string) {
  return status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusBasedProgress(status: string) {
  const key = status.toUpperCase();
  if (key.includes('PUBLISHED') || key.includes('RELEASE')) return 100;
  if (key.includes('BETA')) return 85;
  if (key.includes('ALPHA')) return 42;
  if (key.includes('DEVELOP')) return 68;
  return 31;
}

function formatNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return String(value);
}
