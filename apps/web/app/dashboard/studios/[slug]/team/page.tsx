'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Users, Crown, Shield, Mail, History, UserCheck, UserX, Send, MessageCircle, Trash2 } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { useStudio, useStudioMembers, useUpdateMemberRole, useRemoveMember, useTransferOwnership, useCreateInvitation, useCancelInvitation, useStudioInvitations, useStudioAuditLogs, useApproveJoinRequest, useRejectJoinRequest } from '@/lib/api/hooks';
import type { AuditLogEntry } from '@/lib/api/hooks';
import type { StudioWithMembers } from '@/lib/api/client';
import { TeamMemberCard } from '@/components/team/team-member-card';
import { InviteModal } from '@/components/team/invite-modal';
import type { Invitation } from '@/lib/api/hooks';
import { api } from '@/lib/api/client';

interface FeedChatItem { type: 'chat'; id: string; author: { id: string; displayName: string; username: string; avatarUrl?: string | null }; message: string; createdAt: string }
interface FeedSystemItem { type: 'system'; id: string; action: string; actor: { id: string; displayName: string; username: string; avatarUrl?: string | null } | null; createdAt: string }
type FeedItem = FeedChatItem | FeedSystemItem;

interface RawMember {
  id: string;
  role: string;
  title: string | null;
  user: { id: string; username: string; displayName: string; avatarUrl: string | null };
}

import type { StudioRole } from '@playmorrow/database';

interface CardMember {
  id: string;
  userId: string;
  role: StudioRole;
  title: string | null;
  joinedAt: string;
  user: { id: string; displayName: string; username: string; avatarUrl?: string | null };
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function TeamPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { data: studio, isLoading: studioLoading, error: studioError } = useStudio(slug);
  const { data: studioMembers, isLoading: membersLoading, error: membersError } = useStudioMembers(slug);
  const { data: invitations } = useStudioInvitations(slug);
  const { data: auditLogs } = useStudioAuditLogs(slug);
  const feedKey = `team-feed-${slug}`;
  const [inviteOpen, setInviteOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [feed, setFeed] = useState<FeedItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(feedKey) || '[]'); } catch { return []; }
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    localStorage.setItem(feedKey, JSON.stringify(feed));
  }, [feed, feedKey]);

  useEffect(() => {
    api.get<{ items: FeedItem[] }>(`/studios/${slug}/activities`).then(res => {
      if (res.items?.length) {
        setFeed(prev => {
          const existing = new Set(prev.map(i => i.id));
          const news = res.items.filter(i => !existing.has(i.id));
          if (!news.length) return prev;
          return [...prev, ...news].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });
      }
    }).catch(() => {});
  }, [slug]);

  const sendMessage = async () => {
    if (!chatMessage.trim() || sending) return;
    setSending(true);
    try {
      const msg = await api.post<FeedChatItem>(`/studios/${slug}/chat`, { message: chatMessage.trim() });
      const newItem: FeedChatItem = { type: 'chat', id: msg.id, author: msg.author, message: msg.message, createdAt: msg.createdAt };
      setFeed(prev => [...prev, newItem]);
      setChatMessage('');
    } catch {
      // ignore
    }
    setSending(false);
  };

  const deleteMessage = async (id: string) => {
    try { await api.delete(`/studios/${slug}/chat/${id}`); setFeed(prev => prev.filter(i => i.id !== id)); } catch {}
  };

  const clearMessages = async () => {
    try { await api.delete(`/studios/${slug}/chat`); setFeed(prev => prev.filter(i => i.type !== 'chat')); } catch {}
  };

  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const transferOwnership = useTransferOwnership();
  const createInvitation = useCreateInvitation();
  const cancelInvitation = useCancelInvitation();
  const approveJoin = useApproveJoinRequest();
  const rejectJoin = useRejectJoinRequest();

  const rawMembers = (studioMembers as StudioWithMembers)?.members as RawMember[] | undefined ?? [];
  const members: CardMember[] = (rawMembers ?? []).map(m => ({
    id: m.id,
    userId: m.user.id,
    role: m.role as StudioRole,
    title: m.title,
    joinedAt: '',
    user: { id: m.user.id, displayName: m.user.displayName, username: m.user.username, avatarUrl: m.user.avatarUrl },
  }));
  const pendingRequests = (invitations ?? []).filter((inv) => inv.status === 'REQUESTED');
  const currentMember = user ? members.find((m) => m.userId === user.id) : undefined;
  const currentUserRole = currentMember?.role;
  const isAdminOrOwner = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';
  const grouped = members.reduce<Record<string, CardMember[]>>((acc, m) => {
    const group = acc[m.role];
    if (group) {
      group.push(m);
    } else {
      acc[m.role] = [m];
    }
    return acc;
  }, {});

  const actionLabels: Record<string, string> = {
    MEMBER_INVITED: 'invited a new member',
    INVITATION_ACCEPTED: 'joined the studio',
    INVITATION_CANCELLED: 'cancelled an invitation',
    MEMBER_REMOVED: 'removed a',
    MEMBER_ROLE_CHANGED: 'changed role',
    MEMBER_LEFT: 'left the studio',
    OWNERSHIP_TRANSFERRED: 'transferred ownership',
    GAME_CREATED: 'created a new game',
    GAME_DELETED: 'deleted a game',
    GAME_UPDATED: 'updated a game',
    MEMBER_TITLE_CHANGED: 'changed title',
    MEMBER_JOINED: 'joined the studio',
    JOIN_REQUEST_REJECTED: 'rejected a join request',
    STUDIO_LOGO_CHANGED: 'updated the studio logo',
    STUDIO_BANNER_CHANGED: 'updated the studio banner',
    STUDIO_NAME_CHANGED: 'changed the studio name',
    DEVLOG_PUBLISHED: 'published a devlog',
    ROADMAP_UPDATED: 'updated the roadmap',
  };

  if (studioLoading || membersLoading) {
    return (
      <>
        <SiteHeader />
        <div className="flex min-h-screen items-center justify-center bg-[#020609]">
          <div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
        </div>
      </>
    );
  }

  if (studioError || membersError) {
    return (
      <>
        <SiteHeader />
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#020609] px-4 text-center">
          <p className="font-display text-2xl font-semibold text-coral">Failed to load</p>
          <p className="mt-2 text-sm text-muted-foreground">Could not load team data. Please try again.</p>
          <Link href={`/dashboard/studios/${slug}`} className="mt-6 font-mono text-xs uppercase tracking-widest text-cyan underline">
            Back to settings
          </Link>
        </div>
      </>
    );
  }

  if (!studio) {
    return (
      <>
        <SiteHeader />
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#020609] px-4">
          <p className="font-display text-2xl font-semibold text-foreground">Studio not found</p>
          <Link href="/dashboard" className="mt-4 font-mono text-xs uppercase tracking-widest text-cyan underline">Back to dashboard</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

        <div className="relative mx-auto max-w-4xl px-5 py-6 sm:px-8 lg:px-10">
          <Link href={`/dashboard/studios/${slug}`} className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:text-cyan">
            <ArrowLeft className="size-3" /> Back to settings
          </Link>

          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Team</h1>
              <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-widest text-muted-foreground">
                <Users className="mr-1 inline size-3.5" /> {members.length} member{members.length !== 1 ? 's' : ''}
              </p>
            </div>
            {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN') && (
              <button onClick={() => setInviteOpen(true)}
                className="clip-corner flex cursor-pointer items-center gap-2 border border-cyan bg-cyan/10 px-5 py-2.5 font-mono text-[0.6rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background">
                <UserPlus className="size-4" /> Invite Member
              </button>
            )}
          </div>

          {/* Members grouped by role */}
          <div className="space-y-6">
            {['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER'].map(role => {
              const roleMembers = grouped[role];
              if (!roleMembers?.length) return null;
              const icon = role === 'OWNER' ? <Crown className="size-4 text-orange" /> :
                role === 'ADMIN' ? <Shield className="size-4 text-red" /> : null;
              return (
                <div key={role}>
                  <div className="mb-3 flex items-center gap-2">
                    {icon}
                    <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                      {role} ({roleMembers.length})
                    </h2>
                  </div>
                  <div className="space-y-2">
                    {roleMembers.map((m: CardMember) => (
                      <TeamMemberCard
                        key={m.id}
                        member={m}
                        currentUserId={user?.id ?? ''}
                        currentUserRole={currentUserRole as StudioRole}
                        onRemove={(userId) => removeMember.mutate({ slug, userId })}
                        onPromoteToAdmin={(userId) => updateRole.mutate({ slug, userId, role: 'ADMIN' })}
                        onTransferOwnership={(userId) => transferOwnership.mutate({ slug, targetUserId: userId })}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {Object.keys(grouped).length === 0 && !membersLoading && (
            <div className="clip-corner border border-border/60 bg-[#050b0f]/50 px-6 py-12 text-center">
              <Users className="mx-auto mb-3 size-8 text-muted-foreground" />
              <p className="font-mono text-[0.65rem] text-muted-foreground">No members yet</p>
            </div>
          )}

          {/* Pending Invitations */}
          {(() => {
            const pendingInvites = (invitations ?? []).filter((inv) => inv.status === 'PENDING');
            if (!((currentUserRole === 'OWNER' || currentUserRole === 'ADMIN') && pendingInvites.length > 0)) return null;
            return (
            <div className="mt-10">
              <h2 className="mb-3 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                Pending Invitations ({pendingInvites.length})
              </h2>
              <div className="space-y-2">
                {pendingInvites.map((inv: Invitation) => (
                  <div key={inv.id} className="clip-corner flex items-center gap-3 border border-border/60 bg-[#050b0f]/50 px-4 py-3">
                    <Mail className="size-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-mono text-[0.6rem] text-foreground">{inv.email || inv.userId}</p>
                      <p className="font-mono text-[0.55rem] text-muted-foreground/60">
                        {(inv.role as string).charAt(0) + (inv.role as string).slice(1).toLowerCase()} · Expires {new Date(inv.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button onClick={() => cancelInvitation.mutate({ slug, invitationId: inv.id })}
                      className="cursor-pointer font-mono text-[0.55rem] uppercase tracking-wider text-coral hover:text-coral/80">
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
            );
          })()}

          {/* Pending Requests */}
          {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN') && pendingRequests.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                Pending Requests ({pendingRequests.length})
              </h2>
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="clip-corner flex items-center gap-3 border border-border/60 bg-[#050b0f]/50 px-4 py-3">
                    <div className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-background/60 text-xs font-bold overflow-hidden">
                      {req.user?.avatarUrl ? <img src={req.user.avatarUrl} alt="" className="size-full object-cover" /> : (req.user?.displayName?.slice(0, 1) ?? '?')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[0.6rem] text-foreground">{req.user?.displayName ?? 'Unknown'}</p>
                      <p className="font-mono text-[0.55rem] text-muted-foreground/60">{new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => approveJoin.mutate({ slug, userId: req.userId! })}
                      className="clip-corner flex cursor-pointer items-center gap-1 border border-cyan bg-cyan/10 px-3 py-1.5 font-mono text-[0.55rem] uppercase tracking-wider text-cyan hover:bg-cyan hover:text-background">
                      <UserCheck className="size-3" /> Approve
                    </button>
                    <button onClick={() => rejectJoin.mutate({ slug, userId: req.userId! })}
                      className="clip-corner flex cursor-pointer items-center gap-1 border border-coral/60 px-3 py-1.5 font-mono text-[0.55rem] uppercase tracking-wider text-coral hover:bg-coral/20">
                      <UserX className="size-3" /> Reject
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity */}
          {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN') && auditLogs?.items && auditLogs.items.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-3 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                <History className="mr-1 inline size-3.5" /> Activity
              </h2>
              <div className="space-y-1">
                {auditLogs.items.map((log: AuditLogEntry) => (
                  <div key={log.id} className="flex items-center gap-3 border-b border-border/30 px-2 py-2.5">
                    <div className="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-background/40 overflow-hidden">
                      {log.actor?.avatarUrl ? (
                        <img src={log.actor.avatarUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <span className="text-[9px] font-bold text-muted-foreground">{log.actor?.displayName?.slice(0, 1) ?? '?'}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[0.58rem] text-foreground">
                        <span className="font-semibold text-cyan">{log.actor?.displayName ?? 'Someone'}</span>{' '}
                        {actionLabels[log.action] ?? log.action.toLowerCase()}
                        {log.metadata && typeof log.metadata.role === 'string' && <span className="text-muted-foreground"> {log.metadata.role}</span>}
                      </p>
                    </div>
                    <p className="shrink-0 font-mono text-[0.5rem] text-muted-foreground/50">
                      {formatRelativeTime(log.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Feed */}
          <div className="mt-10">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                <MessageCircle className="mr-1 inline size-3.5" /> Team Feed
              </h2>
              {isAdminOrOwner && (
                <button onClick={clearMessages} className="flex cursor-pointer items-center gap-1 font-mono text-[0.55rem] uppercase tracking-wider text-coral hover:text-coral/80">
                  <Trash2 className="size-3" /> Clear all
                </button>
              )}
            </div>
            <p className="mb-4 font-mono text-[0.55rem] leading-relaxed text-muted-foreground/60">
              Team members can post updates here. Changes to the studio (logo, games, trailers, etc.) appear automatically with a 🤖 icon.
            </p>
            <div className="clip-corner max-h-[400px] overflow-y-auto border border-border/60 bg-[#050b0f]/50">
              {feed.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-cyan/10 text-xl">🎮</div>
                  <p className="font-mono text-[0.6rem] text-foreground">Welcome to the team!</p>
                  <p className="mt-1 font-mono text-[0.55rem] text-muted-foreground">Start by sending a message below. Changes to the studio appear here automatically.</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {feed.map((item, i) => (
                    <div key={item.id ?? i} className="flex items-start gap-3 border-b border-border/20 px-4 py-3">
                      {item.type === 'system' ? (
                        <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-cyan/10 text-[10px]">🤖</div>
                      ) : (
                        <div className="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-background/40 overflow-hidden">
                          {item.author?.avatarUrl ? (
                            <img src={item.author.avatarUrl} alt="" className="size-full object-cover" />
                          ) : (
                            <span className="text-[9px] font-bold text-muted-foreground">{item.author?.displayName?.slice(0, 1) ?? '?'}</span>
                          )}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        {item.type === 'system' ? (
                          <p className="font-mono text-[0.55rem] text-muted-foreground">
                            <span className="font-semibold text-cyan">{item.actor?.displayName ?? 'Someone'}</span>{' '}
                            {actionLabels[item.action] ?? item.action?.toLowerCase()}
                          </p>
                        ) : (
                          <>
                            <p className="font-mono text-[0.55rem] text-muted-foreground">
                              <span className="font-semibold text-cyan">{item.author?.displayName ?? 'Someone'}</span>
                            </p>
                            <p className="mt-0.5 font-mono text-[0.6rem] text-foreground">{item.message}</p>
                          </>
                        )}
                      </div>
                      <p className="shrink-0 font-mono text-[0.5rem] text-muted-foreground/50">{formatRelativeTime(item.createdAt)}</p>
                      {item.type === 'chat' && (isAdminOrOwner || (item as FeedChatItem).author?.id === user?.id) && (
                        <button onClick={() => deleteMessage(item.id)} className="cursor-pointer p-1 text-muted-foreground/40 hover:text-coral transition-colors">
                          <Trash2 className="size-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-2 flex gap-2">
              <input value={chatMessage} onChange={e => setChatMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Write a message..."
                className="clip-corner h-10 flex-1 border border-input bg-background/80 px-4 text-sm text-foreground outline-none focus:border-cyan" />
              <button onClick={sendMessage} disabled={sending || !chatMessage.trim()}
                className="clip-corner flex cursor-pointer items-center gap-1 border border-cyan bg-cyan/10 px-4 font-mono text-[0.6rem] uppercase tracking-wider text-cyan transition hover:bg-cyan hover:text-background disabled:opacity-40">
                <Send className="size-3.5" /> Send
              </button>
            </div>
          </div>
        </div>
      </main>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={async (data) => {
          await createInvitation.mutateAsync({ slug, ...data } as { slug: string; email?: string; userId?: string; role: string; message?: string });
        }}
      />
    </>
  );
}
