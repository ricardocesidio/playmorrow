'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare } from 'lucide-react';

import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { useDevlog, useDevlogComments } from '@/lib/api/hooks';

export default function DevlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: devlog, isLoading, error } = useDevlog(id);
  const { data: comments } = useDevlogComments(id);

  if (isLoading) {
    return (
      <>
        <Nav />
        <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 rounded bg-muted" />
            <div className="h-4 w-96 rounded bg-muted" />
            <div className="h-48 rounded bg-muted" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !devlog) {
    return (
      <>
        <Nav />
        <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-20 text-center">
          <h1 className="text-2xl font-semibold">Devlog not found</h1>
          <p className="mt-2 text-muted-foreground">This devlog doesn&apos;t exist or is private.</p>
          <Link href="/games" className="mt-6 inline-flex items-center gap-2 text-sm text-primary underline">
            <ArrowLeft className="size-4" /> Back to games
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <Link
          href={`/games/${devlog.game.slug}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {devlog.game.title}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">Devlog</span>
            {devlog.publishedAt && (
              <span>{new Date(devlog.publishedAt).toLocaleDateString()}</span>
            )}
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{devlog.title}</h1>

          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
            {devlog.author && (
              <span>By {devlog.author.displayName}</span>
            )}
            <span>·</span>
            <Link href={`/games/${devlog.game.slug}`} className="underline-offset-2 hover:text-primary hover:underline">
              {devlog.game.title}
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
          {devlog.body}
        </div>

        {/* Comments */}
        <section className="mt-16">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <MessageSquare className="size-4" />
            Comments {comments ? `(${comments.length})` : ''}
          </h2>

          {comments?.length ? (
            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="rounded-xl border border-border bg-card/20 p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="grid size-7 place-items-center rounded-full bg-primary/10 text-xs text-primary">
                      {c.author?.displayName?.charAt(0) ?? '?'}
                    </div>
                    <span className="font-medium">{c.author?.displayName ?? 'Deleted'}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {c.isDeleted ? (
                    <p className="mt-2 text-sm italic text-muted-foreground/60">[deleted]</p>
                  ) : (
                    <p className="mt-2 text-sm leading-relaxed">{c.body}</p>
                  )}
                  {c.parentId && (
                    <p className="mt-1 text-xs text-muted-foreground">Reply</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
