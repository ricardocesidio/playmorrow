'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, ThumbsUp, Heart, Zap, Lightbulb, Link as LinkIcon } from 'lucide-react';

import { SanitizedMarkdown } from '@/components/sanitized-markdown';

import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import {
  useDevlog,
  useDevlogReactions,
  useReactToDevlog,
  useRemoveDevlogReaction,
  useDevlogComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  useDevlogCommentReactions,
  useReactToComment,
  useRemoveCommentReaction,
} from '@/lib/api/hooks';
import type { Comment, CommentReactionSummary } from '@/lib/api/client';
const REACTION_ICONS: Record<string, React.ReactNode> = {
  LIKE: <ThumbsUp className="size-3.5" />,
  LOVE: <Heart className="size-3.5" />,
  HYPE: <Zap className="size-3.5" />,
  INSIGHTFUL: <Lightbulb className="size-3.5" />,
};

const ACTIVE_STYLES: Record<string, string> = {
  LIKE: 'border-blue-500/60 bg-blue-500/10 text-blue-400',
  LOVE: 'border-red-500/60 bg-red-500/10 text-red-400',
  HYPE: 'border-green-500/60 bg-green-500/10 text-green-400',
  INSIGHTFUL: 'border-yellow-500/60 bg-yellow-500/10 text-yellow-400',
};

function ReactionButton({
  type,
  count,
  active,
  onClick,
  disabled,
}: {
  type: string;
  count: number;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`clip-corner inline-flex items-center gap-1 border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors cursor-pointer ${
         active
           ? (ACTIVE_STYLES[type] ?? 'border-cyan bg-cyan/10 text-cyan')
           : 'border-border/60 text-muted-foreground hover:border-cyan/40 hover:text-cyan'
       } disabled:opacity-40 cursor-pointer`}
    >
      {REACTION_ICONS[type]}
      <span>{count}</span>
    </button>
  );
}

function DevlogReactions({ devlogId }: { devlogId: string }) {
  const { token, isAuthenticated } = useAuth();
  const { data, isLoading } = useDevlogReactions(devlogId, token ?? undefined);
  const reactMut = useReactToDevlog();
  const unreactMut = useRemoveDevlogReaction();
  const counts = data?.counts ?? { LIKE: 0, LOVE: 0, HYPE: 0, INSIGHTFUL: 0 };
  const viewerReactions = data?.viewerReactions ?? [];

  const handleReact = async (type: string) => {
    if (!isAuthenticated) return;
    const isActive = viewerReactions.includes(type);
    try {
      if (isActive) {
        await unreactMut.mutateAsync({ devlogId, type, token: token || '' });
      } else {
        await reactMut.mutateAsync({ devlogId, type, token: token || '' });
      }
    } catch (e) { toast.error('Something went wrong. Please try again.') }
  };

  if (isLoading) return <div className="mb-8 h-8 animate-pulse rounded-lg bg-muted" />;

  return (
    <div className="mb-8 flex justify-between gap-1">
      {Object.entries(counts).map(([type, count]) => (
        <ReactionButton
          key={type}
          type={type}
          count={count}
          active={viewerReactions.includes(type)}
          onClick={() => handleReact(type)}
          disabled={!isAuthenticated || reactMut.isPending || unreactMut.isPending}
        />
      ))}
    </div>
  );
}

function CommentReactions({
  commentId,
  devlogId,
  reactions,
}: {
  commentId: string;
  devlogId: string;
  reactions?: CommentReactionSummary;
}) {
  const { token, isAuthenticated } = useAuth();
  const reactMut = useReactToComment();
  const unreactMut = useRemoveCommentReaction();
  const counts = reactions?.counts ?? { LIKE: 0, LOVE: 0, HYPE: 0, INSIGHTFUL: 0 };
  const viewerReactions = reactions?.viewerReactions ?? [];

  const handleReact = async (type: string) => {
    if (!isAuthenticated) return;
    const isActive = viewerReactions.includes(type);
    try {
      if (isActive) {
        await unreactMut.mutateAsync({ commentId, devlogId, type, token: token || '' });
      } else {
        await reactMut.mutateAsync({ commentId, devlogId, type, token: token || '' });
      }
    } catch (e) { toast.error('Something went wrong. Please try again.') }
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {Object.entries(counts).filter(([, c]) => c > 0).map(([type, count]) => (
        <button
          key={type}
          onClick={() => handleReact(type)}
          disabled={!isAuthenticated || reactMut.isPending || unreactMut.isPending}
          className={`clip-corner inline-flex items-center gap-0.5 border border-border/50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
            viewerReactions.includes(type)
              ? 'border-cyan bg-cyan/10 text-cyan'
              : 'text-muted-foreground hover:border-cyan/40 hover:text-cyan'
          } disabled:opacity-40`}
        >
          {REACTION_ICONS[type]}
          <span>{count}</span>
        </button>
      ))}
    </div>
  );
}

function CommentItem({
  comment,
  devlogId,
  currentUserId,
  depth,
  token,
  reactionsByComment,
}: {
  token?: string | null;

  comment: Comment;
  devlogId: string;
  currentUserId: string | undefined;
  depth: number;
  reactionsByComment?: Record<string, CommentReactionSummary>;
}) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [editBody, setEditBody] = useState(comment.body ?? '');
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const isAuthor = currentUserId && comment.author?.id === currentUserId;

  const handleReply = async () => {
    if (!replyBody.trim()) return;
    try {
      await createComment.mutateAsync({ devlogId, body: replyBody.trim(), parentId: comment.id, token: token || '' });
      setReplyBody('');
      setReplying(false);
    } catch (e) { toast.error('Failed to post reply.'); }
  };

  const handleEdit = async () => {
    if (!editBody.trim()) return;
    try {
      await updateComment.mutateAsync({ devlogId, commentId: comment.id, body: editBody.trim(), token: token || '' });
      setEditing(false);
    } catch (e) { toast.error('Failed to edit comment.'); }
  };

  const handleDelete = async () => {
    try {
      await deleteComment.mutateAsync({ devlogId, commentId: comment.id, token: token || '' });
    } catch (e) { toast.error('Failed to delete comment.'); }
  };

  return (
    <div className={`clip-corner border border-border/70 bg-[#050b0f]/80 p-4 shadow-[0_0_20px_rgb(0_0_0_/_0.25)] ${depth > 0 ? 'ml-6' : ''}`}>
      {comment.isDeleted || comment.deletedAt ? (
        <p className="text-sm italic text-muted-foreground/60">[deleted]</p>
      ) : editing ? (
        <div className="space-y-2">
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={3}
            className="clip-corner w-full border border-input bg-background/80 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]"
          />
          <div className="flex gap-2">
            <Button onClick={handleEdit} disabled={updateComment.isPending} size="sm">Save</Button>
            <Button onClick={() => setEditing(false)} variant="outline" size="sm">Cancel</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm">
            <div className="grid size-7 place-items-center rounded-full bg-primary/10 text-xs text-primary">
              {comment.author?.displayName?.charAt(0) ?? '?'}
            </div>
            <span className="font-medium">{comment.author?.displayName ?? 'Deleted'}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed">{comment.body}</p>
          <CommentReactions
            commentId={comment.id}
            devlogId={devlogId}
            reactions={reactionsByComment?.[comment.id]}
          />
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <button onClick={() => setReplying(!replying)} className="hover:text-foreground transition-colors">
              Reply
            </button>
            {isAuthor && (
              <>
                <button onClick={() => { setEditBody(comment.body ?? ''); setEditing(true); }} className="hover:text-foreground transition-colors">
                  Edit
                </button>
                <button onClick={handleDelete} className="text-destructive hover:text-destructive/80 transition-colors">
                  Delete
                </button>
              </>
            )}
          </div>

          {replying && (
            <div className="mt-3 space-y-2">
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={2}
                placeholder="Write a reply…"
                aria-label="Write a reply"
                className="clip-corner w-full border border-input bg-background/80 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]"
              />
              <div className="flex gap-2">
                <Button onClick={handleReply} disabled={createComment.isPending} size="sm">
                  {createComment.isPending ? 'Posting…' : 'Reply'}
                </Button>
                <Button onClick={() => setReplying(false)} variant="outline" size="sm">Cancel</Button>
              </div>
              </div>
              )}
        </>
      )}
      {(comment.replies?.length ?? 0) > 0 && depth < 5 && (
        <div className="mt-3 space-y-3">
          {comment.replies!.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              devlogId={devlogId}
              currentUserId={currentUserId}
              depth={depth + 1}
              token={token}
              reactionsByComment={reactionsByComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DevlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token, isAuthenticated } = useAuth();
  const { data: devlog, isLoading, error } = useDevlog(id);
  const { data: comments } = useDevlogComments(id, token ?? undefined);
  // One batched request for every comment's reactions (#9 / #24).
  const { data: commentReactions } = useDevlogCommentReactions(id, token ?? undefined);
  const createComment = useCreateComment();
  const [newComment, setNewComment] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => { const all = (devlog?.screenshots ?? []).map((s) => s.url); return i > 0 ? i - 1 : all.length - 1; });
      if (e.key === 'ArrowRight') setLightboxIndex((i) => { const all = (devlog?.screenshots ?? []).map((s) => s.url); return i < all.length - 1 ? i + 1 : 0; });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, devlog?.screenshots]);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    try {
      await createComment.mutateAsync({ devlogId: id, body: newComment.trim(), token: token || '' });
      setNewComment('');
    } catch (e) { toast.error('Failed to post comment.'); }
  };

  const countAllComments = (items: Comment[]): number =>
    items.reduce((acc, c) => acc + 1 + countAllComments(c.replies ?? []), 0);
  const topLevelComments = comments ?? [];

  if (isLoading) {
    return (
      <>
        <SiteHeader />
        <main className="relative min-h-screen bg-[#020609] px-5 py-6 sm:px-8 lg:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
          <div className="relative mx-auto w-full max-w-3xl">
            <div className="animate-pulse space-y-4">
              <div className="clip-corner h-8 w-64 bg-[#050b0f]/30" />
              <div className="clip-corner h-4 w-96 bg-[#050b0f]/30" />
              <div className="clip-corner h-48 bg-[#050b0f]/30" />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error || !devlog) {
    return (
      <>
        <SiteHeader />
        <main className="relative min-h-screen bg-[#020609] px-5 py-6 sm:px-8 lg:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
          <div className="relative mx-auto w-full max-w-3xl py-20 text-center">
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-white">Devlog not found</h1>
            <p className="mt-2 font-mono text-[0.6rem] text-muted-foreground">This devlog doesn&apos;t exist or is private.</p>
            <Link href="/games" className="mt-6 clip-corner inline-flex items-center gap-2 border border-cyan/60 px-4 py-2 font-mono text-[0.6rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background">
              <ArrowLeft className="size-4" /> Back to games
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]"></div>
        
        {/* Back link */}
        <div className="relative mx-auto max-w-6xl px-5 pt-6 pb-4 sm:px-8 lg:px-10">
          <Link
            href={`/games/${devlog.game.slug}`}
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-cyan transition-colors"
          >
            <ArrowLeft className="size-3.5" /> {devlog.game.title}
          </Link>
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 pb-16 sm:px-8 lg:px-10 lg:grid-cols-[320px_1fr] xl:grid-cols-[380px_1fr]">
            {/* ── LEFT SIDEBAR ── */}
             <aside className="space-y-6">
              {/* Hero image */}
              {devlog.screenshots?.[0] && (
                <div className="clip-corner-sm overflow-hidden cursor-pointer"
                  style={{ border: '2px solid rgb(62 231 255)', animation: 'neonBorder 3s ease-in-out infinite' }}
                  onClick={() => { setLightboxOpen(true); setLightboxIndex(0); }}>
                  <img src={devlog.screenshots[0].url} alt="" className="w-full object-cover" />
                </div>
              )}

              {/* Remaining screenshots gallery */}
              {(() => {
                const screenshots = devlog.screenshots ?? [];
                const remaining = screenshots.slice(1);
                if (remaining.length === 0) return null;
                return (
                  <div className="space-y-3 pt-2 border-t border-border/30">
                    <h3 className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Screenshots</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {remaining.slice(0, 2).map((s, i) => (
                        <div key={s.id} className="aspect-square clip-corner-sm overflow-hidden cursor-pointer" style={{ border: '2px solid rgb(62 231 255)', animation: 'neonBorder 3s ease-in-out infinite' }}
                          onClick={() => { setLightboxOpen(true); setLightboxIndex(i + 1); }}>
                          <img src={s.url} alt={s.caption ?? ''} className="size-full object-cover" />
                        </div>
                      ))}
                    </div>
                    {remaining.length > 2 && (
                      <button onClick={() => { setLightboxOpen(true); setLightboxIndex(1); }}
                        className="w-full clip-corner border border-cyan/40 bg-cyan/5 py-2 font-mono text-[0.5rem] uppercase tracking-widest text-cyan hover:bg-cyan/10 transition-colors cursor-pointer">
                        View all {remaining.length} screenshots
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Reactions */}
              <div>
                <DevlogReactions devlogId={id} />
              </div>

              {/* Share buttons */}
              <div className="grid grid-cols-4 gap-1 pt-2 border-t border-border/30">
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}
                  className="clip-corner flex items-center justify-center border border-cyan/40 px-2 py-2 text-cyan hover:bg-cyan/10 transition-colors cursor-pointer" title="Copy link">
                  <LinkIcon className="size-4" />
                </button>
                <a href={typeof window !== 'undefined' ? `https://x.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(devlog?.title ?? '')}` : '#'} target="_blank" rel="noopener noreferrer"
                  className="clip-corner flex items-center justify-center border border-neutral-400/40 px-2 py-2 text-neutral-400 hover:bg-neutral-400/10 transition-colors" title="Share on X">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href={typeof window !== 'undefined' ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}` : '#'} target="_blank" rel="noopener noreferrer"
                  className="clip-corner flex items-center justify-center border border-blue-600/40 px-2 py-2 text-blue-500 hover:bg-blue-600/10 transition-colors" title="Share on Facebook">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href={typeof window !== 'undefined' ? `https://www.reddit.com/submit?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(devlog?.title ?? '')}` : '#'} target="_blank" rel="noopener noreferrer"
                  className="clip-corner flex items-center justify-center border border-orange-500/40 px-2 py-2 text-orange-500 hover:bg-orange-500/10 transition-colors" title="Share on Reddit">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.928 6.768a1.752 1.752 0 0 1 1.704 2.256 1.752 1.752 0 0 1-.888 1.032c.024.168.048.336.048.504 0 3.36-3.84 6.096-8.592 6.096S1.608 13.92 1.608 10.56c0-.168.024-.336.048-.504a1.776 1.776 0 0 1-.6-.6 1.752 1.752 0 0 1 .6-2.4 1.752 1.752 0 0 1 2.352.36 1.752 1.752 0 0 1 .144 1.92A7.284 7.284 0 0 1 7.2 8.712c.12-.12.264-.216.408-.336a4.307 4.307 0 0 1-.12-1.032 2.16 2.16 0 0 1 2.16-2.16 2.16 2.16 0 0 1 1.848 1.056c.384-.024.768-.048 1.152-.048.576 0 1.152.024 1.704.072a2.138 2.138 0 0 1 1.8-1.08 2.16 2.16 0 0 1 2.16 2.16c0 .36-.096.696-.264.984.144.12.288.24.408.36a7.284 7.284 0 0 1 2.448 1.656c.264-.24.6-.36.96-.36a1.752 1.752 0 0 1 1.752 1.752 1.752 1.752 0 0 1-.888 1.536c0 .168.024.312.024.48 0 2.808-2.832 5.088-6.336 5.568a1.8 1.8 0 0 1 .072.528 1.728 1.728 0 0 1-1.728 1.728 1.728 1.728 0 0 1-1.56-.96 8.242 8.242 0 0 1-3 .024 1.704 1.704 0 0 1-1.488.936 1.728 1.728 0 0 1-1.728-1.728c0-.24.048-.48.144-.696-3.264-.696-5.808-2.88-5.808-5.4 0-.144.024-.288.024-.432a1.752 1.752 0 0 1-.6-.6 1.752 1.752 0 0 1 .6-2.4 1.77 1.77 0 0 1 2.256.288A7.054 7.054 0 0 1 7.56 7.632a2.108 2.108 0 0 1-.072-.528 2.16 2.16 0 0 1 2.16-2.16c.816 0 1.512.456 1.872 1.128.36-.024.72-.048 1.08-.048.48 0 .96.024 1.416.072a2.16 2.16 0 0 1 1.848-1.152 2.16 2.16 0 0 1 2.064 1.656 7.224 7.224 0 0 1 2.472 1.56 1.77 1.77 0 0 1 1.944-.36z"/></svg>
                </a>
              </div>

              {/* Category & date */}
              <div className="flex flex-wrap items-center gap-2 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">
                <span className="clip-corner border border-cyan/60 px-2 py-0.5 text-cyan">Devlog</span>
                {devlog.category && <span className="clip-corner border border-violet/40 bg-violet/5 px-2 py-0.5 text-violet">{devlog.category}</span>}
              </div>
              {devlog.publishedAt && (
                <p className="font-mono text-xs text-muted-foreground">{new Date(devlog.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              )}
              {devlog.readingTimeMin && <p className="font-mono text-xs text-muted-foreground">{devlog.readingTimeMin} min read</p>}

            </aside>

            {/* ── RIGHT COLUMN — CONTENT ── */}
            <div className="min-w-0">
              {/* Title */}
              <h1 className="font-display text-3xl sm:text-4xl font-black leading-[1.05] text-white mb-2">{devlog.title}</h1>
              {devlog.subtitle && (
                <p className="text-base text-muted-foreground/80 mb-4">{devlog.subtitle}</p>
              )}

              {/* Tags */}
              {(devlog.tags?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {devlog.tags.map((tag) => (
                    <span key={tag} className="clip-corner border border-cyan/30 bg-cyan/5 px-2 py-0.5 font-mono text-[0.5rem] uppercase tracking-widest text-cyan/80">{tag}</span>
                  ))}
                </div>
              )}

          {/* Author bar */}
          <div className="flex items-center gap-3 pb-4 border-b border-border/40 mb-6">
            {devlog.author?.avatarUrl && (
              <img src={devlog.author.avatarUrl} alt="" className="size-8 rounded-full border border-border/50 object-cover" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">{devlog.author?.displayName}</span>
                {devlog.author?.role && devlog.author.role !== 'PLAYER' && (
                  <span className="clip-corner border border-cyan/30 bg-cyan/5 px-1.5 py-0.5 font-mono text-[0.45rem] uppercase tracking-widest text-cyan">{devlog.author.role.toLowerCase()}</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
                <Link href={`/games/${devlog.game.slug}`} className="text-cyan/70 hover:text-cyan transition-colors">{devlog.game.title}</Link>
                {devlog.editedAt && <span>· Edited {new Date(devlog.editedAt).toLocaleDateString()}</span>}
              </div>
            </div>
            {isAuthenticated && (
              <Link href={`/dashboard/devlogs/${devlog.id}`} className="ml-auto clip-corner border border-coral/60 bg-coral/10 px-4 py-2 font-mono text-xs uppercase tracking-widest text-coral hover:bg-coral hover:text-coral-foreground transition-colors shadow-[0_0_16px_rgb(255_87_77_/_0.2)]">
                Edit devlog
              </Link>
            )}
          </div>

              {/* Blog body */}
              <article className="prose prose-invert prose-lg max-w-none">
                <SanitizedMarkdown source={devlog.body} />
              </article>

              {/* Comments */}
              <section className="mt-12">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-black uppercase tracking-tight text-white">
              <MessageSquare className="size-4 text-cyan" />
              Comments {comments ? `(${countAllComments(comments)})` : ''}
            </h2>

            {/* Add comment form */}
            {isAuthenticated ? (
              <div className="mb-6 space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  placeholder="Write a comment…"
                  aria-label="Write a comment"
                  className="clip-corner w-full border border-input bg-background/80 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]"
                />
                <Button onClick={handlePostComment} disabled={createComment.isPending || !newComment.trim()}>
                  {createComment.isPending ? 'Posting…' : 'Post comment'}
                </Button>
              </div>
            ) : (
              <div className="clip-corner mb-6 border border-border/70 bg-[#050b0f]/80 p-4 text-center shadow-[0_0_20px_rgb(0_0_0_/_0.25)]">
                <p className="font-mono text-[0.6rem] text-muted-foreground">
                  <Link href="/login" className="text-cyan underline-offset-2 hover:underline">Sign in</Link> to leave a comment.
                </p>
              </div>
            )}

            {/* Comment list */}
            {topLevelComments.length > 0 ? (
              <div className="space-y-4">
                {topLevelComments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    devlogId={id}
                    currentUserId={user?.id}
                    depth={0}
                    token={token}
                    reactionsByComment={commentReactions?.comments}
                  />
                ))}
              </div>
            ) : (
              <p className="font-mono text-[0.6rem] text-muted-foreground">No comments yet.</p>
            )}
          </section>
            </div>
          </div>

          {/* Global lightbox */}
          {lightboxOpen && (() => {
            const all = (devlog.screenshots ?? []).map((s) => s.url);
            return (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95" onClick={() => setLightboxOpen(false)}>
                <button onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i > 0 ? i - 1 : all.length - 1)); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 grid size-12 place-items-center text-white/60 hover:text-white text-3xl cursor-pointer z-10">‹</button>
                <img src={all[lightboxIndex]} alt="" className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
                <button onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i < all.length - 1 ? i + 1 : 0)); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 grid size-12 place-items-center text-white/60 hover:text-white text-3xl cursor-pointer z-10">›</button>
                <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 grid size-10 place-items-center text-white/60 hover:text-white text-xl cursor-pointer z-10">✕</button>
                <div className="absolute bottom-6 left-0 right-0 text-center text-sm text-white/50 font-mono">{lightboxIndex + 1} / {all.length}</div>
              </div>
            );
          })()}
      </main>
    </>
  );
}
