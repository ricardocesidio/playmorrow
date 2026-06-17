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
      className="block rounded-xl border border-border bg-card/30 p-4 transition-colors hover:border-primary/30"
    >
      <div className="flex items-start gap-4">
        {item.game.coverUrl && (
          <div className="shrink-0 overflow-hidden rounded-lg">
            <img src={item.game.coverUrl} alt="" className="size-16 object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">
              {item.type === 'DEVLOG' ? 'Devlog' : 'Roadmap'}
            </span>
            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
          <h3 className="mt-1 font-medium leading-tight">{item.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.summary}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {item.game.title} · {item.studio.name}
          </p>
        </div>
      </div>
    </Link>
  );
}
