'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, ArrowUp, ArrowDown, Milestone, GripVertical } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/api/auth-context';
import { useMyStudios, useGameRoadmap, useCreateRoadmapItem, useUpdateRoadmapItem, useReorderRoadmapItems } from '@/lib/api/hooks';
import type { Game, RoadmapItem } from '@/lib/api/client';
import { ApiError } from '@/lib/api/client';

const STATUSES = ['PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const;

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-blue-500/10 text-blue-400',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-400',
  DONE: 'bg-green-500/10 text-green-400',
  CANCELLED: 'bg-muted text-muted-foreground',
};

export default function RoadmapDashboardPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-6 py-10"><div className="h-96 animate-pulse rounded-xl bg-muted" /></div>}>
      <RoadmapContent />
    </Suspense>
  );
}

function RoadmapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: studios } = useMyStudios(token ?? undefined);

  const [games, setGames] = useState<Game[]>([]);
  const [selectedStudio, setSelectedStudio] = useState('');
  const [gameSlug, setGameSlug] = useState(searchParams.get('game') ?? '');
  const { data: roadmap, isLoading: roadmapLoading } = useGameRoadmap(gameSlug);
  const createItem = useCreateRoadmapItem();
  const updateItem = useUpdateRoadmapItem();
  const reorderItems = useReorderRoadmapItems();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('PLANNED');
  const [targetDate, setTargetDate] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  // Load games when studio selected
  useEffect(() => {
    if (selectedStudio) {
      fetch('/api/studios/' + selectedStudio + '/games')
        .then((r) => r.json() as Promise<{ items: Game[] }>)
        .then((data) => setGames(data.items ?? []))
        .catch(() => setGames([]));
    } else { setGames([]); }
  }, [selectedStudio]);

  // Preselect game from query param
  useEffect(() => {
    if (gameSlug && !selectedStudio && studios) {
      fetch('/api/games/' + gameSlug)
        .then((r) => r.json() as Promise<{ studio: { slug: string } }>)
        .then((g) => { if (g.studio?.slug) setSelectedStudio(g.studio.slug); })
        .catch(() => {});
    }
  }, [gameSlug, studios, selectedStudio]);

  const resetForm = () => {
    setTitle(''); setDescription(''); setStatus('PLANNED'); setTargetDate(''); setError('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameSlug || !title.trim()) { setError('Game and title are required'); return; }
    if (!token) { setError('You must be signed in'); return; }
    setError('');
    try {
      const pos = roadmap?.length ?? 0;
      await createItem.mutateAsync({
        gameSlug, token, title: title.trim(),
        description: description.trim() || undefined,
        status, targetDate: targetDate || undefined,
        position: pos + 1,
      });
      resetForm();
    } catch (err) {
      if (err instanceof ApiError) {
        const msg = typeof err.body === 'object' && err.body
          ? Array.isArray((err.body as { message?: string[] }).message)
            ? (err.body as { message: string[] }).message.join(', ')
            : (err.body as { message: string }).message || 'Failed to create'
          : 'Failed to create';
        setError(msg);
      } else { setError('Something went wrong'); }
    }
  };

  const startEdit = (item: RoadmapItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description ?? '');
    setEditStatus(item.status);
  };

  const saveEdit = async () => {
    if (!editingId || !token) return;
    setError('');
    try {
      await updateItem.mutateAsync({
        id: editingId, token,
        body: { title: editTitle.trim(), description: editDescription.trim() || null, status: editStatus },
      });
      setEditingId(null);
    } catch (err) {
      if (err instanceof ApiError) {
        const msg = (err.body as { message?: string })?.message || 'Failed to update';
        setError(msg);
      } else { setError('Something went wrong'); }
    }
  };

  const moveItem = async (index: number, direction: -1 | 1) => {
    if (!gameSlug || !token || !roadmap) return;
    const newItems = roadmap.map((i) => i);
    const target = index + direction;
    if (target < 0 || target >= newItems.length) return;
    const temp = newItems[index]!;
    newItems[index] = newItems[target]!;
    newItems[target] = temp;
    const payload = newItems.map((item, i) => ({ id: item.id, position: i + 1 }));
    await reorderItems.mutateAsync({ gameSlug, items: payload, token });
  };

  if (authLoading) return null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <Milestone className="size-6 text-primary" />
        <h1 className="text-3xl font-semibold tracking-tight">Roadmap</h1>
      </div>

      {/* Game selector */}
      {!gameSlug && (
        <div className="mb-8 space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Studio</label>
            <select value={selectedStudio} onChange={(e) => setSelectedStudio(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Select a studio…</option>
              {studios?.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
            </select>
          </div>
          {selectedStudio && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Game *</label>
              <select value={gameSlug} onChange={(e) => setGameSlug(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">Select a game…</option>
                {games.map((g) => <option key={g.slug} value={g.slug}>{g.title}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {!gameSlug && !selectedStudio && (
        <div className="rounded-xl border border-border bg-card/20 py-16 text-center">
          <Milestone className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">Select a game to manage its roadmap.</p>
        </div>
      )}

      {gameSlug && (
        <>
          {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}

          {/* Create form */}
          <div className="mb-8 rounded-xl border border-border bg-card/20 p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold"><Plus className="size-4" /> Add roadmap item</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Title" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              <div className="flex flex-wrap gap-3">
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                <Button type="submit" disabled={createItem.isPending} size="sm">
                  {createItem.isPending ? 'Adding…' : 'Add'}
                </Button>
              </div>
            </form>
          </div>

          {/* Roadmap list */}
          {roadmapLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : roadmap && roadmap.length > 0 ? (
            <div className="space-y-2">
              {roadmap.map((item, index) => (
                <div key={item.id} className="rounded-xl border border-border bg-card/30 p-4 transition-colors hover:border-primary/30">
                  {editingId === item.id ? (
                    <div className="space-y-3">
                      <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                      <textarea rows={2} value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                      <div className="flex flex-wrap gap-3">
                        <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <Button size="sm" onClick={saveEdit} disabled={updateItem.isPending}>
                          {updateItem.isPending ? 'Saving…' : 'Save'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <GripVertical className="mt-1 size-4 shrink-0 text-muted-foreground/30" />
                        <div className="min-w-0">
                          <h4 className="text-sm font-medium">{item.title}</h4>
                          {item.description && <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>}
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                            <span className={'rounded px-1.5 py-0.5 ' + (STATUS_COLORS[item.status] ?? '')}>{item.status}</span>
                            {item.targetDate && <span className="text-muted-foreground">{new Date(item.targetDate).toLocaleDateString()}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => moveItem(index, -1)} disabled={index === 0}
                          className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30" title="Move up">
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button onClick={() => moveItem(index, 1)} disabled={index === (roadmap.length - 1)}
                          className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30" title="Move down">
                          <ArrowDown className="size-3.5" />
                        </button>
                        <button onClick={() => startEdit(item)}
                          className="rounded p-1 text-muted-foreground hover:text-foreground" title="Edit">
                          <Pencil className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card/20 py-12 text-center">
              <Milestone className="mx-auto mb-3 size-8 text-muted-foreground/40" />
              <p className="text-muted-foreground">No roadmap items yet.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
