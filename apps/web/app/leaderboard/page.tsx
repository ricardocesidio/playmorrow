'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, ArrowLeft, Loader2 } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { api } from '@/lib/api/client';

interface LeaderboardEntry {
  rank: number; id: string; username: string; displayName: string;
  avatarUrl: string | null; level: number; xp: number; weeklyXp?: number;
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<'all' | 'weekly'>('all');
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<LeaderboardEntry[]>(`/leaderboard${tab === 'weekly' ? '/weekly' : ''}`)
      .then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [tab]);

  const rankColor = (rank: number) => {
    if (rank === 1) return 'text-amber'; if (rank === 2) return 'text-slate-300'; if (rank === 3) return 'text-amber/70';
    return 'text-muted-foreground';
  };
  const rankIcon = (rank: number) => {
    if (rank === 1) return '\u{1F947}'; if (rank === 2) return '\u{1F948}'; if (rank === 3) return '\u{1F949}';
    return `#${rank}`;
  };

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
        <div className="relative mx-auto max-w-3xl px-5 py-8 sm:px-8 lg:px-10">
          <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:text-cyan">
            <ArrowLeft className="size-3" /> Back
          </Link>
          <div className="mb-6 flex items-center gap-3">
            <Trophy className="size-8 text-amber" />
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Leaderboard</h1>
          </div>
          <div className="mb-6 flex gap-4 border-b border-border/60" role="tablist" aria-label="Leaderboard time filters">
            <button
              onClick={() => setTab('all')}
              role="tab"
              aria-selected={tab === 'all'}
              className={`pb-3 font-mono text-[0.6rem] uppercase tracking-widest cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan/50 ${tab === 'all' ? 'border-b-2 border-cyan text-cyan' : 'text-muted-foreground'}`}
            >
              All Time
            </button>
            <button
              onClick={() => setTab('weekly')}
              role="tab"
              aria-selected={tab === 'weekly'}
              className={`pb-3 font-mono text-[0.6rem] uppercase tracking-widest cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan/50 ${tab === 'weekly' ? 'border-b-2 border-cyan text-cyan' : 'text-muted-foreground'}`}
            >
              Weekly
            </button>
          </div>
          {loading ? (
            <div className="space-y-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="clip-corner flex items-center gap-4 border border-border/40 bg-[#050b0f]/50 px-4 py-3 animate-pulse">
                  <div className="w-8 h-4 bg-border/30" />
                  <div className="size-9 rounded-full bg-border/30" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-1/3 bg-border/30" />
                    <div className="h-2 w-1/4 bg-border/20" />
                  </div>
                  <div className="w-16 h-4 bg-border/30" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {data.map((entry) => (
                <Link key={entry.id} href={`/users/${entry.username}`}
                  className="clip-corner flex items-center gap-4 border border-border/60 bg-[#050b0f]/70 px-4 py-3 transition hover:border-cyan/50">
                  <span className={`w-8 text-center font-mono text-[0.65rem] font-bold ${rankColor(entry.rank)}`}>{rankIcon(entry.rank)}</span>
                  <div className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-background/60 text-xs font-bold overflow-hidden">
                    {entry.avatarUrl ? <img src={entry.avatarUrl} className="size-full object-cover" /> : entry.displayName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold text-white">{entry.displayName}</p>
                    <p className="truncate font-mono text-[0.55rem] text-muted-foreground">@{entry.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[0.6rem] text-cyan">Level {entry.level}</p>
                    <p className="font-mono text-[0.5rem] text-muted-foreground">{entry.xp.toLocaleString()} XP{tab === 'weekly' && entry.weeklyXp ? ` \u00B7 +${entry.weeklyXp}` : ''}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
