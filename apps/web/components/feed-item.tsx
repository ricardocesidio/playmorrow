'use client';

import Link from 'next/link';
import type { FeedItem as FeedItemType } from '@/lib/api/client';

export function FeedItemCard({ item }: { item: FeedItemType }) {
  const href = item.type === 'DEVLOG'
    ? `/devlogs/${item.target.id}`
    : `/games/${item.game.slug}`;

  return (
    <Link
      href={href}
      className="clip-corner block border border-border/60 bg-[#050b0f]/50 p-4 transition-colors hover:border-cyan/30"
    >
      <div className="flex items-start gap-4">
        {item.game.coverUrl && (
          <div className="shrink-0 overflow-hidden rounded-lg">
            <img src={item.game.coverUrl} alt="" className="size-16 object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded border border-border/40 px-1.5 py-0.5 font-mono text-[0.5rem] uppercase tracking-wider text-muted-foreground/60">
              {item.type === 'DEVLOG' ? 'Devlog' : 'Roadmap'}
            </span>
            <span className="font-mono text-[0.5rem] text-muted-foreground/50">{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
          <h3 className="mt-1 font-display text-sm font-semibold text-white">{item.title}</h3>
          <p className="mt-1 line-clamp-2 font-mono text-[0.55rem] text-muted-foreground">{item.summary}</p>
          <p className="mt-1 font-mono text-[0.55rem] text-muted-foreground">
            {item.game.title} · {item.studio.name}
          </p>
        </div>
      </div>
    </Link>
  );
}
