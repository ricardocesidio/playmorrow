import { describe, expect, it, vi } from 'vitest';
import { GameEmbeddingRefreshService } from './game-embedding-refresh.service';
import { AIConfig } from '../config/ai.config';

function mockConfig(overrides: Partial<AIConfig> = {}): AIConfig {
  return {
    embeddingsEnabled: true,
    embeddingModel: 'text-embedding-3-small',
    embeddingDimensions: 1536,
    defaultProvider: 'openai',
    ...overrides,
  } as unknown as AIConfig;
}

function makeService(overrides: {
  config?: AIConfig;
  findAll?: Array<{ gameId: string; model: string; dimensions: number; version: number; updatedAt: Date }>;
  published?: Array<{ id: string; title: string; tagline: string | null; description: string | null; updatedAt: Date }>;
  deleteOrphans?: ReturnType<typeof vi.fn>;
  deleteByGameId?: ReturnType<typeof vi.fn>;
  upsert?: ReturnType<typeof vi.fn>;
  embedTexts?: ReturnType<typeof vi.fn>;
  embedText?: ReturnType<typeof vi.fn>;
} = {}) {
  const repo = {
    findAll: vi.fn().mockResolvedValue(overrides.findAll ?? []),
    deleteOrphans: overrides.deleteOrphans ?? vi.fn().mockResolvedValue(0),
    deleteByGameId: overrides.deleteByGameId ?? vi.fn().mockResolvedValue(undefined),
    upsert: overrides.upsert ?? vi.fn().mockResolvedValue(undefined),
  };
  const embedding = {
    embedTexts: overrides.embedTexts ?? vi.fn().mockResolvedValue([]),
    embedText: overrides.embedText ?? vi.fn().mockResolvedValue({ embedding: Array(1536).fill(0.1) }),
  };
  const service = new GameEmbeddingRefreshService(
    { game: { findMany: vi.fn().mockResolvedValue(overrides.published ?? []), findFirst: vi.fn().mockResolvedValue(null) } } as never,
    repo as never,
    embedding as never,
    overrides.config ?? mockConfig() as never,
    { recordEmbedding: vi.fn() } as never,
    { on: vi.fn() } as never,
  );
  return { service, repo, embedding };
}

describe('GameEmbeddingRefreshService', () => {
  it('returns disabled when the feature flag is off', async () => {
    const { service } = makeService({ config: mockConfig({ embeddingsEnabled: false }) });
    const result = await service.refresh();
    expect(result).toEqual({ embedded: 0, skipped: 0, deleted: 0, disabled: true });
  });

  it('aborts the run when stored dimensions do not match config (fail clearly, no wipe)', async () => {
    const { service, repo } = makeService({
      findAll: [
        { gameId: 'g1', model: 'text-embedding-3-small', dimensions: 8, version: 1, updatedAt: new Date() },
      ],
      published: [{ id: 'g1', title: 'A', tagline: null, description: null, updatedAt: new Date() }],
    });
    const result = await service.refresh();
    expect(result).toEqual({ embedded: 0, skipped: 1, deleted: 0, disabled: false });
    expect(repo.deleteOrphans).not.toHaveBeenCalled();
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('never deletes embeddings when the published catalog is empty (F-5 guard)', async () => {
    const deleteOrphans = vi.fn().mockResolvedValue(0);
    const { service, repo } = makeService({
      findAll: [{ gameId: 'g1', model: 'text-embedding-3-small', dimensions: 1536, version: 1, updatedAt: new Date() }],
      published: [],
      deleteOrphans,
    });
    const result = await service.refresh();
    expect(deleteOrphans).not.toHaveBeenCalled();
    expect(result.deleted).toBe(0);
  });

  it('re-embeds on model change even when version and timestamps are current', async () => {
    const now = new Date();
    const { service, repo } = makeService({
      findAll: [{ gameId: 'g1', model: 'text-embedding-ada-002', dimensions: 1536, version: 1, updatedAt: now }],
      published: [{ id: 'g1', title: 'A', tagline: null, description: null, updatedAt: now }],
      embedTexts: vi.fn().mockResolvedValue([{ embedding: Array(1536).fill(0.2) }]),
    });
    const result = await service.refresh();
    expect(result.embedded).toBe(1);
    expect(repo.upsert).toHaveBeenCalledWith('g1', expect.any(Array), 'text-embedding-3-small', 1);
  });

  it('skips per-vector mismatches instead of storing them', async () => {
    const { service, repo } = makeService({
      published: [{ id: 'g1', title: 'A', tagline: null, description: null, updatedAt: new Date() }],
      embedTexts: vi.fn().mockResolvedValue([{ embedding: [0.1, 0.2] }]),
    });
    const result = await service.refresh();
    expect(result.embedded).toBe(0);
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('event-driven refreshGame skips dimension-mismatched vectors', async () => {
    const { service, repo } = makeService({
      embedText: vi.fn().mockResolvedValue({ embedding: [0.1, 0.2, 0.3] }),
    });
    const service2 = new GameEmbeddingRefreshService(
      {
        game: { findMany: vi.fn(), findFirst: vi.fn().mockResolvedValue({ id: 'g9', title: 'X', tagline: null, description: null }) },
      } as never,
      repo as never,
      { embedText: vi.fn().mockResolvedValue({ embedding: [0.1, 0.2, 0.3] }), embedTexts: vi.fn() } as never,
      mockConfig() as never,
      { recordEmbedding: vi.fn() } as never,
      { on: vi.fn() } as never,
    );
    const ok = await service2.refreshGame('g9');
    expect(ok).toBe(false);
  });

  it('event-driven refreshGame deletes the embedding when the game is unpublished', async () => {
    const { service, repo } = makeService();
    const ok = await service.refreshGame('gone-game');
    expect(ok).toBe(false);
    expect(repo.deleteByGameId).toHaveBeenCalledWith('gone-game');
  });
});
