'use client';

import Link from 'next/link';
import type { Game } from '@/lib/api/client';
import { StatusBadge } from './status-badge';

export function GameCard({ game }: { game: Game }) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="group flex flex-col border border-border bg-elevated transition-colors hover:border-border-bright"
    >
      {/* Cover */}
      <div className="relative aspect-[3/2] overflow-hidden bg-muted">
        {game.coverUrl ? (
          <img
            src={game.coverUrl}
            alt={game.title}
            className="size-full object-cover transition-opacity duration-300 group-hover:opacity-80"
          />
        ) : (
          <div className="flex size-full items-center justify-center font-mono text-xs uppercase tracking-widest text-muted-foreground/30">
            No cover
          </div>
        )}
        <div className="absolute right-2 top-2">
          <StatusBadge status={game.status} />
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold leading-tight transition-colors group-hover:text-cyan">
            {game.title}
          </h3>
        </div>

        {game.studio && (
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {game.studio.name}
          </p>
        )}

        {game.tagline && (
          <p className="line-clamp-2 text-sm text-muted-foreground/80">{game.tagline}</p>
        )}

        <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
          {game.tags?.slice(0, 3).map((t) => (
            <span key={t} className="border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
              {t}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
          {game.followersCount > 0 && <span>{game.followersCount} followers</span>}
          {game.priceCents != null && (
            <span>{game.isFree ? 'FREE' : `$${(game.priceCents / 100).toFixed(2)}`}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
