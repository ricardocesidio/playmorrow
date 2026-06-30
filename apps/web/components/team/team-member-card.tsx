'use client';

import { useState } from 'react';
import { MoreHorizontal, Shield, Crown, UserMinus, ArrowUpRight, LogOut } from 'lucide-react';
import type { StudioRole } from '@playmorrow/database';

interface TeamMember {
  id: string;
  userId: string;
  role: StudioRole;
  title?: string | null;
  joinedAt: string;
  user: { id: string; displayName: string; username: string; avatarUrl?: string | null };
}

export interface TeamMemberCardProps {
  member: TeamMember;
  currentUserId: string;
  currentUserRole: StudioRole;
  onRemove: (userId: string) => void;
  onPromoteToAdmin?: (userId: string) => void;
  onUpdateTitle?: (userId: string, title: string) => void;
  onTransferOwnership?: (userId: string) => void;
}

const ROLE_STYLES: Record<StudioRole, { bg: string; text: string; label: string }> = {
  OWNER: { bg: 'bg-orange/10', text: 'text-orange', label: 'Owner' },
  ADMIN: { bg: 'bg-red/10', text: 'text-red', label: 'Admin' },
  MODERATOR: { bg: 'bg-blue/10', text: 'text-blue', label: 'Mod' },
  MEMBER: { bg: 'bg-cyan/10', text: 'text-cyan', label: 'Member' },
};

export function TeamMemberCard({ member, currentUserId, currentUserRole, onRemove, onPromoteToAdmin, onUpdateTitle, onTransferOwnership }: TeamMemberCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [_editingTitle, _setEditingTitle] = useState(false);
  const [_titleInput, _setTitleInput] = useState(member.title || '');
  const isSelf = member.userId === currentUserId;
  const style = ROLE_STYLES[member.role] ?? ROLE_STYLES.MEMBER;

  const canManage = currentUserRole === 'OWNER' || (currentUserRole === 'ADMIN' && (member.role === 'MODERATOR' || member.role === 'MEMBER'));

  return (
    <div className="clip-corner flex items-center gap-4 border border-border/70 bg-[#050b0f]/80 p-4 shadow-[0_0_20px_rgb(0_0_0_/_0.25)]">
      <div className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-background/60 text-sm font-bold text-foreground overflow-hidden">
        {member.user.avatarUrl ? (
          <img src={member.user.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          member.user.displayName.slice(0, 1).toUpperCase()
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-display text-sm font-semibold text-foreground">{member.user.displayName}</p>
          {member.role === 'OWNER' && <Crown className="size-3.5 text-orange" />}
          {member.role === 'ADMIN' && <Shield className="size-3.5 text-red" />}
        </div>
        <p className="truncate font-mono text-[0.58rem] text-muted-foreground">@{member.user.username}</p>
        {member.title && <p className="font-mono text-[0.55rem] text-muted-foreground/60">{member.title}</p>}
        <p className="font-mono text-[0.5rem] text-muted-foreground/40">Joined {new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
      </div>
      <span className={`clip-corner shrink-0 px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-wider ${style.bg} ${style.text}`}>
        {style.label}
      </span>
      {(canManage || isSelf) && (
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="cursor-pointer p-1 text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="size-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 w-44 border border-border bg-[#050b0f] shadow-lg">
                {isSelf && member.role !== 'OWNER' && (
                  <button onClick={() => { onRemove(member.userId); setMenuOpen(false); }}
                    className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 font-mono text-[0.6rem] text-coral hover:bg-coral/10">
                    <LogOut className="size-3.5" /> Leave studio
                  </button>
                )}
                {canManage && !isSelf && (
                  <>
                    {currentUserRole === 'OWNER' && member.role !== 'ADMIN' && (
                      <button onClick={() => { onPromoteToAdmin?.(member.userId); setMenuOpen(false); }}
                        className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 font-mono text-[0.6rem] text-foreground hover:bg-cyan/10">
                        <ArrowUpRight className="size-3.5" /> Promote to Admin
                      </button>
                    )}
                    {currentUserRole === 'OWNER' && member.role === 'ADMIN' && (
                      <button onClick={() => { onTransferOwnership?.(member.userId); setMenuOpen(false); }}
                        className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 font-mono text-[0.6rem] text-amber hover:bg-amber/10">
                        <Crown className="size-3.5" /> Transfer ownership
                      </button>
                    )}
                    <button onClick={() => { onRemove(member.userId); setMenuOpen(false); }}
                      className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 font-mono text-[0.6rem] text-coral hover:bg-coral/10">
                      <UserMinus className="size-3.5" /> Remove member
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
