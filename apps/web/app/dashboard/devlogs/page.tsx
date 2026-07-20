'use client';

import Link from 'next/link';
import { FileText, Plus, ExternalLink, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { useMyDevlogs } from '@/lib/api/hooks';

export default function MyDevlogsPage() {
  const { user, token } = useAuth();
  const { data: devlogs, isLoading } = useMyDevlogs(token ?? undefined);

  if (!user) return null;

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-3 pb-8 pt-3 sm:px-5">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.04)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.03)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-black uppercase text-foreground">My Devlogs</h1>
              <p className="mt-1 text-sm text-muted-foreground">View and manage your development logs across all games.</p>
            </div>
            <Link href="/dashboard/devlogs/new" className="clip-corner inline-flex items-center gap-2 border border-cyan bg-cyan/10 px-5 py-3 font-mono text-xs uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background">
              <Plus className="size-4" /> New Devlog
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-cyan" />
            </div>
          ) : !devlogs || devlogs.length === 0 ? (
            <div className="clip-corner flex flex-col items-center gap-4 border border-border/90 bg-[#050b0f]/86 p-12 text-center">
              <FileText className="size-12 text-muted-foreground" />
              <h2 className="font-display text-xl font-bold text-foreground">No devlogs yet</h2>
              <p className="text-sm text-muted-foreground">Create your first devlog to share development updates with your community.</p>
              <Link href="/dashboard/devlogs/new" className="clip-corner inline-flex items-center gap-2 border border-coral bg-coral px-5 py-3 font-mono text-xs uppercase tracking-widest text-coral-foreground">
                <Plus className="size-4" /> Create Your First Devlog
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {devlogs.map((devlog) => (
                <Link
                  key={devlog.id}
                  href={`/devlogs/${devlog.id}`}
                  className="group flex items-center gap-4 border border-border/90 bg-background/60 p-4 transition hover:-translate-y-0.5 hover:border-cyan/70"
                >
                  <div className="grid size-12 shrink-0 place-items-center border border-cyan/30 bg-cyan/10 text-cyan">
                    <FileText className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="truncate font-display text-base uppercase text-foreground">{devlog.title}</h3>
                      {devlog.status === 'PUBLISHED' ? (
                        <span className="flex items-center gap-1 font-mono text-[0.55rem] uppercase tracking-wider text-success"><CheckCircle2 className="size-3" /> Published</span>
                      ) : devlog.status === 'SCHEDULED' ? (
                        <span className="flex items-center gap-1 font-mono text-[0.55rem] uppercase tracking-wider text-amber"><Clock className="size-3" /> Scheduled</span>
                      ) : (
                        <span className="font-mono text-[0.55rem] uppercase tracking-wider text-muted-foreground">Draft</span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {devlog.subtitle || devlog.excerpt || 'No description'}
                    </p>
                    <div className="mt-1 flex items-center gap-3 font-mono text-[0.58rem] text-muted-foreground">
                      <span>{devlog.game.title}</span>
                      {devlog.category && <span className="text-cyan">{devlog.category}</span>}
                      <span>{new Date(devlog.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ExternalLink className="size-4 shrink-0 text-muted-foreground transition group-hover:text-cyan" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
