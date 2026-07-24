'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Pencil, Trash2, ArrowUp, ArrowDown, Milestone, GripVertical } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { useMyStudios, useGameRoadmap, useCreateRoadmapItem, useUpdateRoadmapItem, useDeleteRoadmapItem, useReorderRoadmapItems } from '@/lib/api/hooks';
import type { Game, RoadmapItem } from '@/lib/api/client';
import { ApiError } from '@/lib/api/client';

const STATUSES = ['PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const;

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'border-blue-500/40 text-blue-400',
  IN_PROGRESS: 'border-amber-500/40 text-amber-400',
  DONE: 'border-green-500/40 text-green-400',
  CANCELLED: 'border-muted-foreground/40 text-muted-foreground',
};

export default function RoadmapDashboardPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#020609]"><div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" /></div>}>
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
  const deleteItem = useDeleteRoadmapItem();
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
        gameSlug, id: editingId, token,
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

  if (authLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 py-6 sm:px-8 lg:px-10">
      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      {/* Top accent line */}
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

      <div className="relative mx-auto max-w-4xl">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:text-cyan">
          <ArrowLeft className="size-3" /> Back to dashboard
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <Milestone className="size-6 text-cyan" />
          <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Roadmap</h1>
        </div>

        {/* Game selector */}
        {!gameSlug && (
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] space-y-3">
            <div>
              <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Studio</label>
              <select value={selectedStudio} onChange={(e) => setSelectedStudio(e.target.value)}
                className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)] cursor-pointer">
                <option value="">Select a studio…</option>
                {studios?.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
              </select>
            </div>
            {selectedStudio && (
              <div>
                <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Game *</label>
                <select value={gameSlug} onChange={(e) => setGameSlug(e.target.value)}
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)] cursor-pointer">
                  <option value="">Select a game…</option>
                  {games.map((g) => <option key={g.slug} value={g.slug}>{g.title}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {!gameSlug && !selectedStudio && (
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 py-16 text-center shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <Milestone className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="font-mono text-[0.68rem] uppercase tracking-widest text-muted-foreground">Select a game to manage its roadmap.</p>
          </div>
        )}

        {gameSlug && (
          <>
            {error && (
              <div className="clip-corner border border-coral/40 bg-coral/5 px-4 py-3 font-mono text-[0.68rem] text-coral mb-4">
                {error}
              </div>
            )}

            {/* Create form */}
            <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] mb-8">
              <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-4 flex items-center gap-2"><Plus className="size-3.5" /> Add roadmap item</h3>
              <form onSubmit={handleCreate} className="space-y-3">
                <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                  className="h-11 shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
                <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="clip-corner w-full resize-none border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
                <div className="flex flex-wrap gap-3">
                  <select value={status} onChange={(e) => setStatus(e.target.value)}
                    className="clip-corner h-11 border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)] cursor-pointer">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
                    className="h-11 shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
                  <Button type="submit" disabled={createItem.isPending}>
                    {createItem.isPending ? 'Adding…' : 'Add'}
                  </Button>
                </div>
              </form>
            </div>

            {/* Roadmap list */}
            {roadmapLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="clip-corner h-16 animate-pulse border border-border/50 bg-[#050b0f]/40 shadow-[0_0_20px_rgb(0_0_0_/_0.2)]" />
                ))}
              </div>
            ) : roadmap && roadmap.length > 0 ? (
              <div className="space-y-2">
                {roadmap.slice(0, 5).map((item, index) => (
                  <div key={item.id} className="clip-corner border border-border/70 bg-[#050b0f]/80 p-4 shadow-[0_0_20px_rgb(0_0_0_/_0.25)] transition hover:border-cyan/40">
                    {editingId === item.id ? (
                      <div className="space-y-3">
                        <Input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                          className="h-11 shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
                        <textarea rows={2} value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
                          className="clip-corner w-full resize-none border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
                        <div className="flex flex-wrap gap-3">
                          <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                            className="clip-corner h-11 border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)] cursor-pointer">
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <Button onClick={saveEdit} disabled={updateItem.isPending}>
                            {updateItem.isPending ? 'Saving…' : 'Save'}
                          </Button>
                          <Button onClick={() => setEditingId(null)} variant="outline">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <GripVertical className="mt-1 size-4 shrink-0 text-muted-foreground/30" />
                          <div className="min-w-0">
                            <h4 className="text-sm font-medium text-foreground">{item.title}</h4>
                            {item.description && <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>}
                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                              <span className={'clip-corner-sm border px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider ' + (STATUS_COLORS[item.status] ?? '')}>{item.status}</span>
                              {item.targetDate && <span className="font-mono text-[0.55rem] uppercase tracking-wider text-muted-foreground">{new Date(item.targetDate).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => moveItem(index, -1)} disabled={index === 0}
                            className="clip-corner cursor-pointer border border-border/40 bg-background/30 p-1.5 text-muted-foreground transition hover:border-cyan/50 hover:text-cyan disabled:opacity-30 disabled:cursor-not-allowed" title="Move up">
                            <ArrowUp className="size-3.5" />
                          </button>
                          <button onClick={() => moveItem(index, 1)} disabled={index === (roadmap.length - 1)}
                            className="clip-corner cursor-pointer border border-border/40 bg-background/30 p-1.5 text-muted-foreground transition hover:border-cyan/50 hover:text-cyan disabled:opacity-30 disabled:cursor-not-allowed" title="Move down">
                            <ArrowDown className="size-3.5" />
                          </button>
                          <button onClick={() => startEdit(item)}
                            className="clip-corner cursor-pointer border border-border/40 bg-background/30 p-1.5 text-muted-foreground transition hover:border-cyan/50 hover:text-cyan" title="Edit">
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (!token) return;
                              try { await deleteItem.mutateAsync({ gameSlug, id: item.id, token }); } catch { /* ignore */ }
                            }}
                            disabled={deleteItem.isPending}
                            className="clip-corner cursor-pointer border border-border/40 bg-background/30 p-1.5 text-muted-foreground transition hover:border-coral/50 hover:text-coral disabled:opacity-30 disabled:cursor-not-allowed" title="Delete">
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="clip-corner border border-border/70 bg-[#050b0f]/80 py-12 text-center shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
                <Milestone className="mx-auto mb-3 size-8 text-muted-foreground/40" />
                <p className="font-mono text-[0.68rem] uppercase tracking-widest text-muted-foreground">No roadmap items yet.</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
    </>
  );
}
