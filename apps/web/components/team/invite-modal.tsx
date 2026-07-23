'use client';

import { useState } from 'react';
import { X, Mail, Search, Send, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  onInvite: (data: { email?: string; userId?: string; role: string; message?: string }) => Promise<void>;
}

export function InviteModal({ open, onClose, onInvite }: InviteModalProps) {
  const [tab, setTab] = useState<'email' | 'search'>('email');
  const [email, setEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [role, setRole] = useState('MODERATOR');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (tab === 'email' && !email.trim()) { setError('Email is required'); return; }
    if (tab === 'search' && !selectedUserId) { setError('Select a user'); return; }
    setLoading(true);
    try {
      await onInvite({
        email: tab === 'email' ? email.trim() : undefined,
        userId: tab === 'search' ? selectedUserId! : undefined,
        role,
        message: message.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Invite Member">
      <div className="mb-5 flex border-b border-border/60">
          <button onClick={() => { setTab('email'); setError(''); }} className={`flex-1 pb-3 font-mono text-[0.6rem] uppercase tracking-widest ${tab === 'email' ? 'border-b-2 border-cyan text-cyan' : 'text-muted-foreground'}`}>
            <Mail className="mr-1 inline size-3" /> By Email
          </button>
          <button onClick={() => { setTab('search'); setError(''); }} className={`flex-1 pb-3 font-mono text-[0.6rem] uppercase tracking-widest ${tab === 'search' ? 'border-b-2 border-cyan text-cyan' : 'text-muted-foreground'}`}>
            <Search className="mr-1 inline size-3" /> Search User
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'email' ? (
            <div>
              <label className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Email address</label>
              <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="user@example.com" autoFocus className="h-11" />
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Search by username</label>
              {selectedUserId ? (
                <div className="flex items-center justify-between rounded border border-cyan/50 bg-cyan/5 px-4 py-3">
                  <span className="text-sm text-foreground">{selectedUserName}</span>
                  <button type="button" onClick={() => { setSelectedUserId(null); setSelectedUserName(''); }} className="cursor-pointer text-coral hover:text-coral/80"><X className="size-4" /></button>
                </div>
              ) : (
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Type a username..." autoFocus className="h-11" />
              )}
            </div>
          )}

          <div>
            <label className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none cursor-pointer">
              <option value="MODERATOR">Moderator</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Message (optional)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} placeholder="Join us!"
              className="clip-corner w-full resize-none border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none focus:border-cyan" />
          </div>

          {error && <p className="font-mono text-[0.6rem] text-coral">{error}</p>}

          <button type="submit" disabled={loading}
            className="clip-corner flex w-full cursor-pointer items-center justify-center gap-2 border border-cyan bg-cyan/10 px-6 py-3 font-mono text-[0.65rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background disabled:opacity-40">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {loading ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
    </Modal>
  );
}
