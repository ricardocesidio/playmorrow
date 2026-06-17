'use client';

import Link from 'next/link';
import type { Game } from '@/lib/api/client';
import { Tag } from './tag';

export function GameCard({ game }: { game: Game }) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="group block overflow-hidden rounded-xl border border-border bg-card/40 transition-colors hover:border-primary/40"
    >
      {/* Cover */}
      <div className="aspect-video w-full overflow-hidden bg-muted">
        {game.coverUrl ? (
          <img
            src={game.coverUrl}
            alt={game.title}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground/30 text-sm">
            No cover
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors">
            {game.title}
          </h3>
          <span className="shrink-0 text-xs text-muted-foreground">{game.status}</span>
        </div>

        {game.studio && (
          <p className="text-sm text-muted-foreground">{game.studio.name}</p>
        )}

        {game.tagline && (
          <p className="line-clamp-2 text-sm text-muted-foreground/80">{game.tagline}</p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {game.tags?.slice(0, 3).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {game.followersCount > 0 && <span>{game.followersCount} followers</span>}
          {game.priceCents != null && (
            <span>{game.isFree ? 'Free' : `$${(game.priceCents / 100).toFixed(2)}`}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
