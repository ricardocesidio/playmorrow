'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, ThumbsUp, Heart, Zap, Lightbulb } from 'lucide-react';

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
      className={`clip-corner inline-flex items-center gap-1 border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors ${
        active
          ? 'border-cyan bg-cyan/10 text-cyan'
          : 'border-border/60 text-muted-foreground hover:border-cyan/40 hover:text-cyan'
      } disabled:opacity-40`}
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
        await unreactMut.mutateAsync({ devlogId, type, token: token! });
      } else {
        await reactMut.mutateAsync({ devlogId, type, token: token! });
      }
    } catch { /* ignore */ }
  };

  if (isLoading) return <div className="mb-8 h-8 animate-pulse rounded-lg bg-muted" />;

  return (
    <div className="mb-8 flex flex-wrap items-center gap-2">
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
        await unreactMut.mutateAsync({ commentId, devlogId, type, token: token! });
      } else {
        await reactMut.mutateAsync({ commentId, devlogId, type, token: token! });
      }
    } catch { /* ignore */ }
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
    if (!replyBody.trim() || !token) return;
    try {
      await createComment.mutateAsync({ devlogId, body: replyBody.trim(), parentId: comment.id, token });
      setReplyBody('');
      setReplying(false);
    } catch { /* ignore */ }
  };

  const handleEdit = async () => {
    if (!editBody.trim() || !token) return;
    try {
      await updateComment.mutateAsync({ commentId: comment.id, body: editBody.trim(), token });
      setEditing(false);
    } catch { /* ignore */ }
  };

  const handleDelete = async () => {
    if (!token || !confirm('Delete this comment?')) return;
    try {
      await deleteComment.mutateAsync({ commentId: comment.id, token });
    } catch { /* ignore */ }
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
            <button onClick={handleEdit} disabled={updateComment.isPending} className="clip-corner border border-cyan bg-cyan/10 px-4 py-1.5 font-mono text-[0.6rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background disabled:opacity-40">Save</button>
            <button onClick={() => setEditing(false)} className="clip-corner border border-border/60 px-4 py-1.5 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan hover:text-cyan">Cancel</button>
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
                className="clip-corner w-full border border-input bg-background/80 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]"
              />
              <div className="flex gap-2">
                <button onClick={handleReply} disabled={createComment.isPending} className="clip-corner border border-cyan bg-cyan/10 px-4 py-1.5 font-mono text-[0.6rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background disabled:opacity-40">
                  {createComment.isPending ? 'Posting…' : 'Reply'}
                </button>
                <button onClick={() => setReplying(false)} className="clip-corner border border-border/60 px-4 py-1.5 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan hover:text-cyan">Cancel</button>
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

  const handlePostComment = async () => {
    if (!newComment.trim() || !token) return;
    try {
      await createComment.mutateAsync({ devlogId: id, body: newComment.trim(), token });
      setNewComment('');
    } catch { /* ignore */ }
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
      <main className="relative min-h-screen bg-[#020609] px-5 py-6 sm:px-8 lg:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
        
        <div className="relative mx-auto w-full max-w-3xl">
          <Link
            href={`/games/${devlog.game.slug}`}
            className="mb-6 clip-corner inline-flex items-center gap-1.5 border border-border/60 px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan hover:text-cyan"
          >
            <ArrowLeft className="size-4" /> {devlog.game.title}
          </Link>

          {/* Header */}
          <div className="clip-corner mb-8 border border-border/70 bg-[#050b0f]/80 p-5 shadow-[0_0_20px_rgb(0_0_0_/_0.25)] sm:p-7">
            <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">
              <span className="clip-corner border border-cyan/60 px-1.5 py-0.5 text-cyan">Devlog</span>
              {devlog.publishedAt && <span className="normal-case">{new Date(devlog.publishedAt).toLocaleDateString()}</span>}
            </div>

            <h1 className="mt-3 font-display text-3xl font-black uppercase tracking-tight text-white">{devlog.title}</h1>
            {devlog.subtitle && (
              <p className="mt-1 font-mono text-sm text-muted-foreground">{devlog.subtitle}</p>
            )}

            {(devlog.status || devlog.category || (devlog.tags?.length ?? 0) > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {devlog.status && devlog.status !== 'PUBLISHED' && (
                  <span className={`clip-corner px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-widest ${
                    devlog.status === 'SCHEDULED' ? 'border border-amber/40 bg-amber/5 text-amber' : 'border border-border/40 bg-background/30 text-muted-foreground'
                  }`}>
                    {devlog.status === 'DRAFT' ? 'Draft' : 'Scheduled'}
                  </span>
                )}
                {devlog.category && (
                  <span className="clip-corner border border-violet/40 bg-violet/5 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-widest text-violet">{devlog.category}</span>
                )}
                {devlog.tags?.map((tag) => (
                  <span key={tag} className="clip-corner border border-cyan/30 bg-cyan/5 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-widest text-cyan/80">{tag}</span>
                ))}
              </div>
            )}

            {devlog.screenshots?.length > 0 && (
              <div className="mt-4 flex gap-2 overflow-x-auto">
                {devlog.screenshots.map((s) => (
                  <img key={s.id} src={s.url} alt={s.caption ?? ''} className="h-32 border border-border/50 object-cover" />
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[0.6rem] text-muted-foreground">
              {devlog.author?.avatarUrl && (
                <img src={devlog.author.avatarUrl} alt="" className="size-6 rounded-full border border-border/50" />
              )}
              {devlog.author && <span className="font-semibold text-foreground">{devlog.author.displayName}</span>}
              {devlog.author?.role && devlog.author.role !== 'PLAYER' && (
                <span className="clip-corner border border-cyan/30 bg-cyan/5 px-1.5 py-0.5 font-mono text-[0.5rem] uppercase tracking-widest text-cyan">{devlog.author.role.toLowerCase()}</span>
              )}
              <span>·</span>
              <Link href={`/games/${devlog.game.slug}`} className="text-cyan underline-offset-2 hover:underline">
                {devlog.game.title}
              </Link>
              {devlog.readingTimeMin && <span className="text-muted-foreground/60">· {devlog.readingTimeMin} min read</span>}
              {devlog.editedAt && <span className="text-muted-foreground/60">· edited {new Date(devlog.editedAt).toLocaleDateString()}</span>}
            </div>
          </div>

          {/* Reaction bar */}
          <DevlogReactions devlogId={id} />

          {/* Content */}
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 shadow-[0_0_20px_rgb(0_0_0_/_0.25)] sm:p-7">
            <SanitizedMarkdown
              source={devlog.body}
              className="prose prose-invert max-w-none font-mono text-[0.6rem]"
            />
          </div>

          {/* Comments */}
          <section className="mt-16">
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
                  className="clip-corner w-full border border-input bg-background/80 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]"
                />
                <button onClick={handlePostComment} disabled={createComment.isPending || !newComment.trim()} className="clip-corner border border-cyan bg-cyan/10 px-5 py-2 font-mono text-[0.6rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background disabled:opacity-40">
                  {createComment.isPending ? 'Posting…' : 'Post comment'}
                </button>
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
      </main>
    </>
  );
}
