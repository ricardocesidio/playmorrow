'use client';

import Link from 'next/link';
import { Bookmark, Users } from 'lucide-react';
import { formatFollowers } from '@/lib/format';
import type { Game } from '@/lib/api/client';
import { StatusBadge } from './status-badge';

export function GameCard({ game }: { game: Game }) {
  const cover = game.coverUrl ?? coverForGame(game.title);
  const progress = progressForGame(game.slug);
  const accent = statusAccent(game.status);

  return (
    <Link
      href={`/games/${game.slug}`}
      className="group panel relative flex min-h-[228px] flex-col overflow-hidden border-border/90 bg-card transition duration-200 hover:border-cyan/70 hover:shadow-[0_0_28px_rgb(62_231_255_/_0.11)]"
    >
      <div className="relative aspect-[1.82] overflow-hidden bg-muted">
        <img
          src={cover}
          alt={game.title}
          className="size-full object-cover transition duration-300 group-hover:scale-[1.035]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/28 to-transparent" />
        <div className="absolute left-3 top-3">
          <StatusBadge status={game.status} />
        </div>
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
          {(game.platformLinks?.length ? game.platformLinks.map((p) => p.platform) : ['PC', 'PS5', 'XBOX']).slice(0, 4).map((platform) => (
            <span key={platform} className="border border-border px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground">
              {platform}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

function coverForGame(title: string) {
  const key = title.toLowerCase();
  if (key.includes('starfall')) return '/playmorrow/starfall-tactics.png';
  if (key.includes('moss')) return '/playmorrow/mossbound.png';
  if (key.includes('paper')) return '/playmorrow/paper-relics.png';
  if (key.includes('void')) return '/playmorrow/voidrunner.png';
  if (key.includes('little')) return '/playmorrow/little-giants.png';
  if (key.includes('echo')) return '/playmorrow/echobloom.png';
  if (key.includes('north')) return '/playmorrow/northlight.png';
  return '/playmorrow/neon-warden.png';
}

function progressForGame(slug: string) {
  const value = Array.from(slug).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 18 + (value % 54);
}
function statusAccent(status: string) {
  if (status === 'ALPHA') return { bar: 'bg-violet text-violet' };
  if (status === 'PRE_ALPHA') return { bar: 'bg-amber text-amber' };
  return { bar: 'bg-cyan text-cyan' };
}
