'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, ThumbsUp, Heart, Zap, Lightbulb } from 'lucide-react';

import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
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
  useCommentReactions,
  useReactToComment,
  useRemoveCommentReaction,
} from '@/lib/api/hooks';
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
      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs transition-colors ${
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
      } disabled:opacity-50`}
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

function CommentReactions({ commentId }: { commentId: string }) {
  const { token, isAuthenticated } = useAuth();
  const { data } = useCommentReactions(commentId, token ?? undefined);
  const reactMut = useReactToComment();
  const unreactMut = useRemoveCommentReaction();
  const counts = data?.counts ?? { LIKE: 0, LOVE: 0, HYPE: 0, INSIGHTFUL: 0 };
  const viewerReactions = data?.viewerReactions ?? [];

  const handleReact = async (type: string) => {
    if (!isAuthenticated) return;
    const isActive = viewerReactions.includes(type);
    try {
      if (isActive) {
        await unreactMut.mutateAsync({ commentId, type, token: token! });
      } else {
        await reactMut.mutateAsync({ commentId, type, token: token! });
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
          className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] transition-colors ${
            viewerReactions.includes(type)
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground'
          } disabled:opacity-50`}
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
}: {
  token?: string | null;

  comment: { id: string; body: string | null; parentId: string | null; isDeleted?: boolean; deletedAt: string | null; author: { id: string; username: string; displayName: string; avatarUrl: string | null } | null; createdAt: string; updatedAt: string };
  devlogId: string;
  currentUserId: string | undefined;
  depth: number;
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
    <div className={`rounded-xl border border-border bg-card/20 p-4 ${depth > 0 ? 'ml-6' : ''}`}>
      {comment.isDeleted || comment.deletedAt ? (
        <p className="text-sm italic text-muted-foreground/60">[deleted]</p>
      ) : editing ? (
        <div className="space-y-2">
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleEdit} disabled={updateComment.isPending}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
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
          <CommentReactions commentId={comment.id} />
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
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleReply} disabled={createComment.isPending}>
                  {createComment.isPending ? 'Posting…' : 'Reply'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setReplying(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function DevlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token, isAuthenticated } = useAuth();
  const { data: devlog, isLoading, error } = useDevlog(id);
  const { data: comments } = useDevlogComments(id, token ?? undefined);
  const createComment = useCreateComment();
  const [newComment, setNewComment] = useState('');

  const handlePostComment = async () => {
    if (!newComment.trim() || !token) return;
    try {
      await createComment.mutateAsync({ devlogId: id, body: newComment.trim(), token });
      setNewComment('');
    } catch { /* ignore */ }
  };

  const topLevelComments = comments?.filter((c) => !c.parentId) ?? [];
  const replies = comments?.filter((c) => c.parentId) ?? [];

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
            {devlog.publishedAt && <span>{new Date(devlog.publishedAt).toLocaleDateString()}</span>}
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{devlog.title}</h1>

          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
            {devlog.author && <span>By {devlog.author.displayName}</span>}
            <span>·</span>
            <Link href={`/games/${devlog.game.slug}`} className="underline-offset-2 hover:text-primary hover:underline">
              {devlog.game.title}
            </Link>
          </div>
        </div>

        {/* Reaction bar */}
        <DevlogReactions devlogId={id} />

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

          {/* Add comment form */}
          {isAuthenticated ? (
            <div className="mb-6 space-y-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                placeholder="Write a comment…"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button onClick={handlePostComment} disabled={createComment.isPending || !newComment.trim()}>
                {createComment.isPending ? 'Posting…' : 'Post comment'}
              </Button>
            </div>
          ) : (
            <div className="mb-6 rounded-xl border border-border bg-card/20 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                <Link href="/login" className="text-primary underline-offset-2 hover:underline">Sign in</Link> to leave a comment.
              </p>
            </div>
          )}

          {/* Comment list */}
          {topLevelComments.length > 0 ? (
            <div className="space-y-4">
              {topLevelComments.map((comment) => (
                <div key={comment.id}>
                  <CommentItem comment={comment} devlogId={id} currentUserId={user?.id} depth={0} token={token} />
                  {replies
                    .filter((r) => r.parentId === comment.id)
                    .map((reply) => (
                      <div key={reply.id} className="mt-2">
                        <CommentItem comment={reply} devlogId={id} currentUserId={user?.id} depth={1} token={token} />
                      </div>
                    ))}
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
