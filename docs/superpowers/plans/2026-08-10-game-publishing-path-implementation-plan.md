# Game Publishing Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make it possible for a real studio to publish a real game through the product (`Game.isPublished = true`) via a server-authoritative, auditable, authorized `POST /api/games/:slug/publish` path — unblocking the empty production catalog so the M23 experiment can eventually receive real discovery data.

**Architecture:** `isPublished` is the single publication flag; `GameStatus` remains a development-stage label (independent — no second state machine, no schema change). A new `GamePublicationService` owns readiness validation + the transactional publish (audit `GAME_PUBLISHED` + `game_published` EventBus event emitted only on the real `false → true` transition). Public catalog (`GET /api/games`) and public search games branch (`GET /api/search`) get `isPublished: true` filters; studio-dashboard endpoints stay unrestricted. Frontend gets a Publication card + `usePublishGame()` hook on the game edit page.

**Tech Stack:** NestJS (apps/api), Prisma (packages/database), Next.js 15 + React 19 + TanStack Query (apps/web), Vitest + Supertest (e2e against docker postgres-test on :5433), pnpm + turbo.

## Global Constraints

- **M23 OBSERVATION FREEZE ACTIVE** (2026-08-10 → 2026-08-17). Do NOT touch frozen components: scoring weights, candidate generation, semantic search, embedding model/dims, MMR, ranking, personalization, rollout %, UX, explanations, feedback semantics, CTR/impression/dismissal/wishlist definitions. This sprint is a **product/platform fix outside M23** (STATUS.md issue #8). No algorithm change, no data fabrication, no rollout change, no M22/M24/M25/M26 work.
- **No schema change → no migration.** `packages/database/prisma/schema.prisma` is NOT modified. `isPublished`, `publishedBy`, `publishedAt` already exist on `Game` (schema lines ~557, 567-568).
- **No unpublish action.** No `isPublished` field in Create/Update DTOs. `GET /games/:slug` stays open (shared with studio dashboard editing — recorded follow-up, not fixed this sprint).
- **Publish authorization:** OWNER/ADMIN/MODERATOR only (global ADMIN/MODERATOR bypass already inside `assertStudioAccess`). MEMBER → 403.
- **Completeness gate (backend is authority):** title, tagline, description, coverUrl, ≥1 SCREENSHOT media, ≥1 platform link, ≥1 tag. Incomplete → 400 + stable `missing` key list.
- **Idempotency:** second publish of an already-published game → 200 no-op (no new timestamp/audit/event).
- **CANCELLED games → blocked with 400.**
- **ValidationPipe has `whitelist: true, forbidNonWhitelisted: true`** (both prod `main.ts` and test harness `create-test-app.ts`). A forged `{ isPublished: true }` in a PATCH body is therefore **rejected with 400**, not silently ignored — the e2e test asserts 400 + DB unchanged.
- Quality gates before completion: `pnpm verify` (lint + typecheck + build) all green; full API test suite green against the :5433 test DB; no new ESLint errors (pre-existing warnings in `apps/web` and `apps/api` are untouched).
- Commit style: `feat:`, `test:`, `fix:`, `refactor:`, `chore:` — one commit per task (see AGENTS.md history).

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `apps/api/src/games/games.service.ts` | Remove RELEASED auto-stamp; `findAll()` filter; export `GAME_INCLUDE` + `toResponse` | Modify |
| `apps/api/src/games/game-publication.service.ts` | Readiness validation + transactional publish + audit + events | Create |
| `apps/api/src/audit-log/audit-log.service.ts` | Optional `tx` param on `log()` | Modify |
| `apps/api/src/games/games.module.ts` | Register `GamePublicationService` | Modify |
| `apps/api/src/games/games.controller.ts` | `POST games/:slug/publish` endpoint | Modify |
| `apps/api/src/search/search.service.ts` | `isPublished: true` in `buildGameWhere` games branch | Modify |
| `apps/api/src/games/games.controller.spec.ts` | Publish e2e tests; update 2 existing catalog tests; add `SearchModule` import | Modify |
| `apps/web/lib/api/hooks.ts` | `usePublishGame()` | Modify |
| `apps/web/app/dashboard/games/[slug]/page.tsx` | Publication card | Modify |
| `docs/ai/M23_FREEZE_CHANGE_LOG.md` | Freeze log entry | Modify |
| `docs/ai/M23_CATALOG_READINESS.md` | Catalog Ready / Measurable Catalog definitions | Modify |
| `ARCHITECTURE.md`, `README.md`, `STATUS.md`, `docs/handoff/HANDOFF.md`, `AGENTS.md`, `CHANGELOG.md` | Docs | Modify |
| `docs/releases/M23_CATALOG_READINESS_CERTIFICATION.md` | Final certification report | Create |

---

## Task 1: Remove the RELEASED auto-stamp in `games.service.ts`

**Files:**
- Modify: `apps/api/src/games/games.service.ts:288-292`

**Interfaces:**
- Consumes: `UpdateGameDto` (existing), `StudioRole` (existing).
- Produces: `update()` no longer writes `publishedBy`/`publishedAt`. Publication metadata is set **only** by `GamePublicationService.publishGame` (Task 3).

- [ ] **Step 1: Locate the auto-stamp block**

Open `apps/api/src/games/games.service.ts` around line 285. You must see this inside the `if (!isMember) { ... }` block:

```ts
      // publishedBy/publishedAt must be set BEFORE the update call
      if (dto.status === 'RELEASED') {
        data.publishedBy = userId;
        data.publishedAt = new Date();
      }
```

- [ ] **Step 2: Delete the auto-stamp block**

Remove exactly these 4 lines (the comment and the `if` block):

```ts
      // publishedBy/publishedAt must be set BEFORE the update call
      if (dto.status === 'RELEASED') {
        data.publishedBy = userId;
        data.publishedAt = new Date();
      }
```

The surrounding `if (!isMember) { ... }` block must remain intact — the `status`, `releaseDate`, `expectedReleaseText`, `priceCents`, `currency`, `isFree` assignments stay. Only the `publishedBy`/`publishedAt` stamping is removed.

- [ ] **Step 3: Verify the diff**

Run: `git diff apps/api/src/games/games.service.ts`
Expected: only the 4-line deletion inside the `!isMember` block. No other changes.

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @playmorrow/api typecheck`
Expected: exit 0, no errors. (`publishedBy`/`publishedAt` are nullable in Prisma — nothing else depends on this block.)

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/games/games.service.ts
git commit -m "fix(games): remove RELEASED auto-stamp of publishedBy/publishedAt"
```

---

## Task 2: Export `GAME_INCLUDE` and make `toResponse` public

**Files:**
- Modify: `apps/api/src/games/games.service.ts:17, 36, 410`

**Interfaces:**
- Consumes: nothing new.
- Produces: `export const GAME_INCLUDE`, `export type GameWithInclude`, public `toResponse(...)` — consumed by `GamePublicationService` (Task 3) so the publish response matches every other game endpoint shape.

- [ ] **Step 1: Export `GAME_INCLUDE`**

At line 17, change:

```ts
const GAME_INCLUDE = {
```
to:

```ts
export const GAME_INCLUDE = {
```

- [ ] **Step 2: Export the type**

At line 36, change:

```ts
type GameWithInclude = Prisma.GameGetPayload<{ include: typeof GAME_INCLUDE }>;
```
to:

```ts
export type GameWithInclude = Prisma.GameGetPayload<{ include: typeof GAME_INCLUDE }>;
```

- [ ] **Step 3: Make `toResponse` public**

At line 410, change:

```ts
  private toResponse(game: {
```
to:

```ts
  toResponse(game: {
```

(Only the `private` keyword changes — the inline parameter type and body stay identical.)

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @playmorrow/api typecheck`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/games/games.service.ts
git commit -m "refactor(games): export GAME_INCLUDE and toResponse for publication service"
```

## Task 3: Create `GamePublicationService` (+ audit-log tx support)

**Files:**
- Create: `apps/api/src/games/game-publication.service.ts`
- Modify: `apps/api/src/audit-log/audit-log.service.ts`
- Modify: `apps/api/src/games/games.module.ts`

**Interfaces:**
- Consumes: `PrismaService`, `GamesService` (Task 2: `toResponse` + `GAME_INCLUDE`), `AuditLogService` (now with optional `tx`), `EventBus`, `FeedEngineService`, `assertStudioAccess`, `StudioRole`, `logger`.
- Produces:
  - `export type MissingRequirementKey = 'title' | 'tagline' | 'description' | 'coverUrl' | 'screenshot' | 'platformLink' | 'tag'`
  - `validateGamePublicationReadiness(game: GameWithInclude): MissingRequirementKey[]`
  - `publishGame(userId: string, slug: string): Promise<ReturnType<GamesService['toResponse']>>` — the single source of truth: loads (404), authorizes (403), rejects CANCELLED (400), idempotent (200 no-op), validates readiness (400 + missing list), transactional update + audit, post-commit `game_published` EventBus event + `GAME_PUBLISHED` feed event, returns the canonical game response.

- [ ] **Step 1: Write the service file**

Create `apps/api/src/games/game-publication.service.ts`:

```ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StudioRole } from '@playmorrow/database';
import { AuditLogService } from '../audit-log/audit-log.service';
import { EventBus } from '../common/event-bus';
import { logger } from '../common/logger';
import { assertStudioAccess } from '../common/studio-permissions';
import { FeedEngineService } from '../feed/feed-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { GAME_INCLUDE, GamesService, type GameWithInclude } from './games.service';

export type MissingRequirementKey =
  | 'title'
  | 'tagline'
  | 'description'
  | 'coverUrl'
  | 'screenshot'
  | 'platformLink'
  | 'tag';

@Injectable()
export class GamePublicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamesService: GamesService,
    private readonly auditLog: AuditLogService,
    private readonly eventBus: EventBus,
    private readonly feedEngine: FeedEngineService,
  ) {}

  validateGamePublicationReadiness(game: GameWithInclude): MissingRequirementKey[] {
    const missing: MissingRequirementKey[] = [];
    if (!game.title?.trim()) missing.push('title');
    if (!game.tagline?.trim()) missing.push('tagline');
    if (!game.description?.trim()) missing.push('description');
    if (!game.coverUrl?.trim()) missing.push('coverUrl');
    if (!game.media?.some((m) => m.type === 'SCREENSHOT')) missing.push('screenshot');
    if (!game.platformLinks?.length) missing.push('platformLink');
    if (!game.tags?.length) missing.push('tag');
    return missing;
  }

  async publishGame(userId: string, slug: string): Promise<ReturnType<GamesService['toResponse']>> {
    // GAME_INCLUDE spread + studio.members override: readiness checks need
    // media/platformLinks/tags (from GAME_INCLUDE), authorization needs
    // studio.members. The resulting type is a superset of GameWithInclude
    // (studio carries extra fields) — assignable everywhere it's used.
    const game = await this.prisma.game.findUnique({
      where: { slug: slug.toLowerCase() },
      include: { ...GAME_INCLUDE, studio: { include: { members: true } } },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    assertStudioAccess({ id: userId, role: user.role }, game.studio.members, [
      StudioRole.OWNER,
      StudioRole.ADMIN,
      StudioRole.MODERATOR,
    ]);

    if (game.status === 'CANCELLED') {
      throw new BadRequestException('CANCELLED games cannot be published');
    }

    // Idempotent: already published → 200 no-op, no new timestamp/audit/event.
    if (game.isPublished) {
      return this.gamesService.toResponse(game);
    }

    const missing = this.validateGamePublicationReadiness(game);
    if (missing.length > 0) {
      // NOTE: prod GlobalExceptionFilter flattens object responses (drops
      // extra fields) — embed the keys in the message string so test and
      // production responses are identical. The stable key list is still
      // exposed via validateGamePublicationReadiness() (service contract).
      throw new BadRequestException(
        `Game is not ready to publish. Missing: ${missing.join(', ')}`,
      );
    }

    const publishedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.game.update({
        where: { id: game.id },
        data: { isPublished: true, publishedBy: userId, publishedAt },
      });
      await this.auditLog.log(
        {
          studioId: game.studioId,
          actorId: userId,
          action: 'GAME_PUBLISHED',
          targetType: 'GAME',
          targetId: game.id,
          metadata: { title: game.title },
        },
        tx,
      );
    });

    // Post-commit side effects — only on the real false → true transition.
    this.eventBus.emit({
      type: 'game_published',
      actorId: userId,
      gameId: game.id,
      studioId: game.studioId,
      targetType: 'GAME',
      targetId: game.id,
      metadata: { title: game.title },
    });

    this.feedEngine
      .emit('GAME_PUBLISHED', {
        studioId: game.studioId,
        gameId: game.id,
        actorId: userId,
        payload: { title: game.title, slug: game.slug },
      })
      .catch((err) => logger.error({ err }));

    const published = await this.prisma.game.findUnique({
      where: { id: game.id },
      include: GAME_INCLUDE,
    });
    if (!published) {
      throw new NotFoundException('Game not found');
    }

    return this.gamesService.toResponse(published);
  }
}
```

- [ ] **Step 2: Extend `AuditLogService.log` with an optional transaction client**

Open `apps/api/src/audit-log/audit-log.service.ts` and change:

```ts
  async log(params: {
    studioId: string;
    actorId: string;
    action: string;
    targetType: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.auditLog.create({
```
to:

```ts
  async log(
    params: {
      studioId: string;
      actorId: string;
      action: string;
      targetType: string;
      targetId?: string;
      metadata?: Record<string, unknown>;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.auditLog.create({
```

(`Prisma` is already imported at the top of the file — `import type { Prisma } from '@playmorrow/database'`.) All existing `auditLog.log({...})` call sites keep working unchanged (the new param is optional).

- [ ] **Step 3: Register the service in `games.module.ts`**

Open `apps/api/src/games/games.module.ts`. Add the import after `import { GamesService } from './games.service';`:

```ts
import { GamePublicationService } from './game-publication.service';
```

And change the providers line:

```ts
  providers: [GamesService, CountersService],
```
to:

```ts
  providers: [GamesService, GamePublicationService, CountersService],
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @playmorrow/api typecheck`
Expected: exit 0. (`GAME_INCLUDE` already includes `media`, `platformLinks`, `tags` — see `games.service.ts` lines 18-26 — so `validateGamePublicationReadiness` compiles against `GameWithInclude`.)

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/games/game-publication.service.ts apps/api/src/games/games.module.ts apps/api/src/audit-log/audit-log.service.ts
git commit -m "feat(games): add GamePublicationService with readiness gate and transactional publish"
```

---

## Task 4: Add `POST /games/:slug/publish` endpoint

**Files:**
- Modify: `apps/api/src/games/games.controller.ts`

**Interfaces:**
- Consumes: `GamePublicationService.publishGame(userId, slug): Promise<ReturnType<GamesService['toResponse']>>` (Task 3).
- Produces: `POST /api/games/:slug/publish`. States: 401 (anonymous) · 403 (non-member or MEMBER) · 404 (missing) · 400 (incomplete or CANCELLED) · 200 (idempotent or real publish).

- [ ] **Step 1: Add the route**

In `apps/api/src/games/games.controller.ts`, add this method right after the `update` handler and before `remove`:

```ts
  @Post('games/:slug/publish')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Game published.' })
  async publish(@CurrentUser() user: { id: string }, @Param('slug') slug: string) {
    return this.gamePublicationService.publishGame(user.id, slug);
  }
```

- [ ] **Step 2: Wire the service into the controller constructor**

Add the import after `import { GamesService } from './games.service';`:

```ts
import { GamePublicationService } from './game-publication.service';
```

Change the constructor:

```ts
  constructor(
    private readonly gamesService: GamesService,
    private readonly analyticsService: AnalyticsService,
    private readonly eventBus: EventBus,
  ) {}
```
to:

```ts
  constructor(
    private readonly gamesService: GamesService,
    private readonly analyticsService: AnalyticsService,
    private readonly eventBus: EventBus,
    private readonly gamePublicationService: GamePublicationService,
  ) {}
```

(`Post` is already imported at the top of the controller file.)

- [ ] **Step 3: Build + typecheck**

Run: `pnpm --filter @playmorrow/api build`
Expected: exit 0, Nest build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/games/games.controller.ts
git commit -m "feat(games): add POST /games/:slug/publish endpoint"
```

---

## Task 5: Fix public catalog — `findAll()` filters `isPublished: true`

**Files:**
- Modify: `apps/api/src/games/games.service.ts:187-193`

**Interfaces:**
- Consumes: nothing new.
- Produces: `GET /api/games` returns only published games. Studio endpoints (`findByStudioSlug`) untouched → drafts stay visible in the dashboard.

- [ ] **Step 1: Add the filter**

In `findAll()`, change:

```ts
  ) {
    const where: Prisma.GameWhereInput = {};
```
to:

```ts
  ) {
    const where: Prisma.GameWhereInput = { isPublished: true };
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @playmorrow/api typecheck`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/games/games.service.ts
git commit -m "fix(games): public catalog lists only published games"
```

---

## Task 6: Fix public search — `buildGameWhere` games branch filters `isPublished: true`

**Files:**
- Modify: `apps/api/src/search/search.service.ts:120-162`

**Interfaces:**
- Consumes: nothing new.
- Produces: `GET /api/search` games branch returns only published games. Studios/devlogs branches unchanged.

- [ ] **Step 1: Add the filter**

In `apps/api/src/search/search.service.ts`, in `buildGameWhere()`, change:

```ts
  private buildGameWhere(term: string, filters: SearchFilters): Prisma.GameWhereInput {
    const and: Prisma.GameWhereInput[] = [];
```
to:

```ts
  private buildGameWhere(term: string, filters: SearchFilters): Prisma.GameWhereInput {
    const and: Prisma.GameWhereInput[] = [{ isPublished: true }];
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @playmorrow/api typecheck`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/search/search.service.ts
git commit -m "fix(search): games branch returns only published games"
```

## Task 7: Frontend hook `usePublishGame()`

**Files:**
- Modify: `apps/web/lib/api/hooks.ts`

**Interfaces:**
- Consumes: `api.post<Game>` (existing), `useMutation`/`useQueryClient` (existing imports), `revalidateFeed`/`revalidateHomepage` (already imported at line 7), `toast` (already imported).
- Produces: `usePublishGame()` — consumed by the edit page (Task 8).

- [ ] **Step 1: Add the hook**

In `apps/web/lib/api/hooks.ts`, insert this right after the `useDeleteGame()` hook (after line ~1013):

```ts
export function usePublishGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string }) => api.post<Game>(`/games/${data.slug}/publish`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myGames'] });
      qc.invalidateQueries({ queryKey: ['games'] });
      qc.invalidateQueries({ queryKey: ['game'] });
      revalidateFeed();
      revalidateHomepage();
      toast.success('Game published');
    },
    onError: () => toast.error('Failed to publish game'),
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @playmorrow/web typecheck`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/api/hooks.ts
git commit -m "feat(web): add usePublishGame hook"
```

---

## Task 8: Publication card on the game edit page

**Files:**
- Modify: `apps/web/app/dashboard/games/[slug]/page.tsx`

**Interfaces:**
- Consumes: `useGame(slug)` → `game` (has `isPublished`, `title`, `tagline`, `description`, `coverUrl`, `media` (`{type}`), `platformLinks`, `tags: string[]`); `usePublishGame()` (Task 7); `Button` (already imported); `Loader2` (already imported).
- Produces: Publication card UI — state badge, readiness checklist from the already-loaded game, `Publish Game` button with disabled/loading states, toasts + cache invalidation via the hook. Backend remains authority (the card is UX only).

- [ ] **Step 1: Import the hook + Game type**

Change the import at line 13:

```ts
import { useGame, useUpdateGame, useDeleteGame } from '@/lib/api/hooks';
```
to:

```ts
import { useGame, useUpdateGame, useDeleteGame, usePublishGame } from '@/lib/api/hooks';
```

Change the import at line 14:

```ts
import { ApiError } from '@/lib/api/client';
```
to:

```ts
import { ApiError, type Game } from '@/lib/api/client';
```

- [ ] **Step 2: Call the hook inside the component**

After line 46 (`const deleteGame = useDeleteGame();`), add:

```ts
  const publishGame = usePublishGame();
```

- [ ] **Step 3: Define the readiness helper (module level)**

After the `AVAILABLE_TAGS` array (after line 38), add:

```ts
const PUBLICATION_REQUIREMENTS: { key: string; label: string; isMet: (game: Game) => boolean }[] = [
  { key: 'title', label: 'Title', isMet: (g) => Boolean(g.title?.trim()) },
  { key: 'tagline', label: 'Tagline', isMet: (g) => Boolean(g.tagline?.trim()) },
  { key: 'description', label: 'Description', isMet: (g) => Boolean(g.description?.trim()) },
  { key: 'coverUrl', label: 'Cover image', isMet: (g) => Boolean(g.coverUrl?.trim()) },
  { key: 'screenshot', label: 'At least one screenshot', isMet: (g) => (g.media ?? []).some((m) => m.type === 'SCREENSHOT') },
  { key: 'platformLink', label: 'At least one platform link', isMet: (g) => (g.platformLinks ?? []).length > 0 },
  { key: 'tag', label: 'At least one tag', isMet: (g) => (g.tags ?? []).length > 0 },
];
```

- [ ] **Step 4: Add the Publication card JSX**

In the main return (after line 234, i.e. right after the header `</div>` that contains "View public page", and before `<form onSubmit={handleSubmit} className="space-y-8">`), insert:

```tsx
        {/* Publication */}
        <div className="clip-corner border border-border/70 panel p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] mb-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan">Publication</h3>
            {game.isPublished ? (
              <span className="font-mono text-[0.6rem] uppercase tracking-widest text-cyan">Published ✓</span>
            ) : (
              <span className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Not published</span>
            )}
          </div>

          {!game.isPublished && (
            <>
              <ul className="mb-4 space-y-1.5">
                {PUBLICATION_REQUIREMENTS.map((req) => {
                  const met = req.isMet(game);
                  return (
                    <li key={req.key} className="flex items-center gap-2 font-mono text-[0.6rem]">
                      <span className={met ? 'text-cyan' : 'text-coral'}>{met ? '✓' : '✗'}</span>
                      <span className={met ? 'text-muted-foreground' : 'text-coral'}>{req.label}</span>
                    </li>
                  );
                })}
              </ul>
              <Button
                type="button"
                onClick={async () => {
                  if (!token) return;
                  try {
                    await publishGame.mutateAsync({ slug });
                  } catch (err) {
                    if (err instanceof ApiError && err.status === 403) {
                      setError("You don't have permission to publish this game.");
                    }
                  }
                }}
                disabled={!PUBLICATION_REQUIREMENTS.every((r) => r.isMet(game)) || publishGame.isPending}
              >
                {publishGame.isPending ? <Loader2 className="size-3 animate-spin" /> : null}
                {publishGame.isPending ? 'Publishing…' : 'Publish Game'}
              </Button>
            </>
          )}
        </div>
```

Notes:
- The checklist renders only while unpublished; once published, the card shows the "Published ✓" badge.
- The button is disabled until every requirement is met (mirrors the backend gate — backend remains authority).
- `publishGame.mutateAsync` shows the success/error toasts and invalidates `myGames`/`games`/`game` queries, so the card flips to "Published ✓" after refetch.
- The `setError` reuse shows 403s in the existing error banner at the top of the form.

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm --filter @playmorrow/web typecheck && pnpm --filter @playmorrow/web lint`
Expected: typecheck exit 0; lint 0 new errors (pre-existing warnings in this file are untouched).

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/dashboard/games/[slug]/page.tsx
git commit -m "feat(web): add publication card with readiness checklist to game editor"
```

## Task 9: Extend e2e tests — `games.controller.spec.ts`

**Files:**
- Modify: `apps/api/src/games/games.controller.spec.ts`

**Interfaces:**
- Consumes: `registerTestUser` / `createTestApp` (from `../test/`), `EventBus` (from `../common/event-bus`), real test DB via `TEST_DATABASE_URL` (docker :5433).
- Produces: publish e2e coverage — auth matrix, state handling, completeness gate, persistence, audit, events, catalog/search presence, draft isolation, forged-payload rejection. Also updates 2 existing tests that assert drafts in the public catalog (which Tasks 5-6 intentionally change).

**Background (verified):** The spec file already creates `GAME_SLUG` ("Echoes of the Deep", complete: title/tagline/description/coverUrl/1 screenshot/1 platform link/2 tags) via the OWNER. This is the ideal publish fixture. Existing tests "GET /api/games lists created game" (line 231) and "GET /api/games supports search query" (line 238) will FAIL after Task 5 — they must be rewritten to assert draft isolation (that's the intended new behavior). A MEMBER-created game (`test-game-2-${SUFFIX}`, title-only) already exists as an incomplete draft fixture.

- [ ] **Step 1: Add new spec constants**

At the top of the file (after line 30 `const GAME_SLUG = ...`), add:

```ts
const MODERATOR_EMAIL = `moderator_${SUFFIX}@example.com`;
const INCOMPLETE_SLUG = `incomplete-${SUFFIX}`;
const CANCELLED_SLUG = `cancelled-${SUFFIX}`;
const FORGE_SLUG = `forge-${SUFFIX}`;
const ADMIN_PUB_SLUG = `adminpub-${SUFFIX}`;
const MODERATOR_PUB_SLUG = `moderatorpub-${SUFFIX}`;
```

- [ ] **Step 2: Add `moderatorToken` variable**

In the `describe` block (near line 43), add:

```ts
  let moderatorToken: string;
```

- [ ] **Step 3: Register the moderator user + studio membership in `beforeAll`**

In `beforeAll`, after the ADMIN registration block (after line 78), register the moderator:

```ts
    const moderator = await registerTestUser(httpServer, prisma, MODERATOR_EMAIL, PASSWORD);
    moderatorToken = moderator.sessionCookie;
```

Then, after the existing "Add member user as MEMBER" block (after line 93, where `studioRec` and `memberUser` are already defined), add:

```ts
    // Add moderator user as MODERATOR
    const moderatorUser = await prisma.user.findUnique({ where: { email: cleanEmail(MODERATOR_EMAIL) } });
    if (studioRec && moderatorUser) {
      await prisma.studioMember.create({
        data: { studioId: studioRec.id, userId: moderatorUser.id, role: 'MODERATOR' },
      });
    }
```

(Note: `studioRec` is defined at line 87 — the membership block must come after it. The existing MEMBER block at lines 87-93 shows the exact pattern to copy.)

- [ ] **Step 4: Rewrite the two public-catalog tests to assert draft isolation**

Replace the test at line 231:

```ts
  it('GET /api/games lists created game', async () => {
    const res = await request(httpServer).get('/api/games');
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.items.some((g: { slug: string }) => g.slug === GAME_SLUG)).toBe(true);
  });
```
with:

```ts
  it('GET /api/games excludes unpublished drafts', async () => {
    const res = await request(httpServer).get('/api/games');
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.items.some((g: { slug: string }) => g.slug === GAME_SLUG)).toBe(false);
    expect(res.body.items.some((g: { slug: string }) => g.slug === `test-game-2-${SUFFIX}`)).toBe(false);
  });
```

Replace the test at line 238:

```ts
  it('GET /api/games supports search query', async () => {
    const res = await request(httpServer).get('/api/games?search=Echoes');
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.items[0].slug).toBe(GAME_SLUG);
  });
```
with:

```ts
  it('GET /api/games search query also excludes unpublished drafts', async () => {
    const res = await request(httpServer).get('/api/games?search=Echoes');
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.items.some((g: { slug: string }) => g.slug === GAME_SLUG)).toBe(false);
  });
```

- [ ] **Step 5: Add the PUBLISH test block**

Insert a new section at the end of the `describe`, after the SECURITY test (after line 316, before the closing `});` at line 335). The full block:

```ts
  // ── PUBLISH ─────────────────────────────────────────────────────────────

  it('POST /api/games/:slug/publish rejects unauthenticated', async () => {
    const res = await request(httpServer).post(`/api/games/${GAME_SLUG}/publish`);
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/games/:slug/publish rejects non-member with 403', async () => {
    const res = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/publish`)
      .set('Cookie', `playmorrow_session=${nonMemberToken}`);
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('POST /api/games/:slug/publish rejects MEMBER role with 403', async () => {
    const res = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/publish`)
      .set('Cookie', `playmorrow_session=${memberToken}`);
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('POST /api/games/:slug/publish returns 404 for a missing game', async () => {
    const res = await request(httpServer)
      .post(`/api/games/missing-${SUFFIX}/publish`)
      .set('Cookie', `playmorrow_session=${ownerToken}`);
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('POST /api/games/:slug/publish returns 400 with missing list for an incomplete game', async () => {
    // Create a title-only game (incomplete)
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ title: 'Incomplete Game', slug: INCOMPLETE_SLUG })
      .expect(HttpStatus.CREATED);

    const res = await request(httpServer)
      .post(`/api/games/${INCOMPLETE_SLUG}/publish`)
      .set('Cookie', `playmorrow_session=${ownerToken}`);

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
    expect(String(res.body.message)).toContain('Game is not ready to publish');
    expect(String(res.body.message)).toContain('tagline');
    expect(String(res.body.message)).toContain('description');
    expect(String(res.body.message)).toContain('screenshot');
  });

  it('POST /api/games/:slug/publish rejects CANCELLED games with 400', async () => {
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ title: 'Cancelled Game', slug: CANCELLED_SLUG, status: 'CANCELLED' })
      .expect(HttpStatus.CREATED);

    const res = await request(httpServer)
      .post(`/api/games/${CANCELLED_SLUG}/publish`)
      .set('Cookie', `playmorrow_session=${ownerToken}`);

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('POST /api/games/:slug/publish allows studio OWNER and persists metadata', async () => {
    const gameBefore = await prisma.game.findUnique({ where: { slug: GAME_SLUG } });
    expect(gameBefore?.isPublished).toBe(false);

    const res = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/publish`)
      .set('Cookie', `playmorrow_session=${ownerToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.isPublished).toBe(true);

    const gameAfter = await prisma.game.findUnique({ where: { slug: GAME_SLUG } });
    expect(gameAfter?.isPublished).toBe(true);
    expect(gameAfter?.publishedAt).not.toBeNull();
    expect(gameAfter?.publishedBy).not.toBeNull();
  });

  it('POST /api/games/:slug/publish is idempotent (no re-stamp on second call)', async () => {
    const before = await prisma.game.findUnique({ where: { slug: GAME_SLUG } });

    const res = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/publish`)
      .set('Cookie', `playmorrow_session=${ownerToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    const after = await prisma.game.findUnique({ where: { slug: GAME_SLUG } });
    expect(after?.isPublished).toBe(true);
    expect(after?.publishedAt?.toISOString()).toBe(before?.publishedAt?.toISOString());
  });

  it('POST /api/games/:slug/publish writes a GAME_PUBLISHED audit log entry', async () => {
    const game = await prisma.game.findUnique({ where: { slug: GAME_SLUG } });
    const entry = await prisma.auditLog.findFirst({
      where: { action: 'GAME_PUBLISHED', targetId: game?.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(entry).not.toBeNull();
    expect(entry?.targetType).toBe('GAME');
  });

  it('POST /api/games/:slug/publish emits a game_published event on the real transition', async () => {
    const eventBus = app.get(EventBus);
    const received: string[] = [];
    const handler = (e: { type: string; gameId?: string }) => {
      if (e.type === 'game_published') received.push(e.type);
    };
    eventBus.on('game_published', handler);

    // Already published (idempotent) — no new event expected.
    await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/publish`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .expect(HttpStatus.OK);
    expect(received).toHaveLength(0);

    // Publish a fresh game — exactly one event.
    const freshSlug = `fresh-${SUFFIX}`;
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({
        title: 'Fresh Publish Game',
        slug: freshSlug,
        tagline: 'Fresh tagline',
        description: 'Fresh description',
        coverUrl: 'https://example.com/fresh-cover.jpg',
        platformLinks: [{ platform: 'STEAM', url: 'https://store.steampowered.com/app/fresh' }],
        media: [{ type: 'SCREENSHOT', url: 'https://example.com/fresh-screen.jpg' }],
        tags: ['adventure'],
      })
      .expect(HttpStatus.CREATED);

    // NOTE: games.service create() also emits game_published (pre-existing
    // behavior at games.service.ts:147) — reset the capture so we only count
    // events caused by the publish call itself.
    received.length = 0;

    await request(httpServer)
      .post(`/api/games/${freshSlug}/publish`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .expect(HttpStatus.OK);

    expect(received).toHaveLength(1);
  });

  it('POST /api/games/:slug/publish allows global ADMIN', async () => {
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({
        title: 'Admin Publish Game',
        slug: ADMIN_PUB_SLUG,
        tagline: 'Admin tagline',
        description: 'Admin description',
        coverUrl: 'https://example.com/admin-cover.jpg',
        platformLinks: [{ platform: 'STEAM', url: 'https://store.steampowered.com/app/admin' }],
        media: [{ type: 'SCREENSHOT', url: 'https://example.com/admin-screen.jpg' }],
        tags: ['adventure'],
      })
      .expect(HttpStatus.CREATED);

    const res = await request(httpServer)
      .post(`/api/games/${ADMIN_PUB_SLUG}/publish`)
      .set('Cookie', `playmorrow_session=${adminToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.isPublished).toBe(true);
  });

  it('POST /api/games/:slug/publish allows studio MODERATOR', async () => {
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({
        title: 'Moderator Publish Game',
        slug: MODERATOR_PUB_SLUG,
        tagline: 'Moderator tagline',
        description: 'Moderator description',
        coverUrl: 'https://example.com/moderator-cover.jpg',
        platformLinks: [{ platform: 'STEAM', url: 'https://store.steampowered.com/app/moderator' }],
        media: [{ type: 'SCREENSHOT', url: 'https://example.com/moderator-screen.jpg' }],
        tags: ['adventure'],
      })
      .expect(HttpStatus.CREATED);

    const res = await request(httpServer)
      .post(`/api/games/${MODERATOR_PUB_SLUG}/publish`)
      .set('Cookie', `playmorrow_session=${moderatorToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.isPublished).toBe(true);
  });

  it('published games appear in the public catalog and search', async () => {
    const catalogRes = await request(httpServer).get('/api/games');
    expect(catalogRes.status).toBe(HttpStatus.OK);
    expect(catalogRes.body.items.some((g: { slug: string }) => g.slug === GAME_SLUG)).toBe(true);

    const searchRes = await request(httpServer).get(`/api/search?q=${encodeURIComponent('Echoes')}`);
    expect(searchRes.status).toBe(HttpStatus.OK);
    expect(searchRes.body.games?.items?.some((g: { slug: string }) => g.slug === GAME_SLUG)).toBe(true);
  });

  it('forged isPublished in PATCH body is rejected and never publishes', async () => {
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ title: 'Forge Target', slug: FORGE_SLUG })
      .expect(HttpStatus.CREATED);

    // forbidNonWhitelisted:true → unknown property is rejected with 400.
    const res = await request(httpServer)
      .patch(`/api/games/${FORGE_SLUG}`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ isPublished: true });

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);

    const game = await prisma.game.findUnique({ where: { slug: FORGE_SLUG } });
    expect(game?.isPublished).toBe(false);
  });
```

- [ ] **Step 6: Import `EventBus` + `SearchModule`**

Add to the imports at the top of the spec file:

```ts
import { EventBus } from '../common/event-bus';
import { SearchModule } from '../search/search.module';
```

Add `SearchModule,` to the `imports` array inside `beforeAll` (the test app must serve `GET /api/search`):

```ts
        imports: [
          ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', 'apps/api/.env'] }),
          PrismaModule,
          UsersModule,
          AuthModule,
          EventBusModule,
          NotificationsModule,
          MockEmailModule,
          ScheduleModule.forRoot(),
          StudiosModule,
          GamesModule,
          SearchModule,
        ],
```

(`SearchModule` is self-contained — it only needs `PrismaModule`; no new env vars or providers are required.)

- [ ] **Step 7: Run the spec against the test DB**

Start the disposable test DB (if not already running):

```bash
pnpm --filter @playmorrow/api test:db:up
```

Run the games spec:

```bash
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/playmorrow_test?schema=public pnpm --filter @playmorrow/api exec vitest run src/games/games.controller.spec.ts
```

Expected: all tests pass, including the 2 rewritten catalog tests and the new PUBLISH block.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/games/games.controller.spec.ts
git commit -m "test(games): e2e coverage for publish endpoint, draft isolation and forged payload"
```

## Task 10: Freeze change log + catalog readiness doc

**Files:**
- Modify: `docs/ai/M23_FREEZE_CHANGE_LOG.md`
- Modify: `docs/ai/M23_CATALOG_READINESS.md`

**Interfaces:**
- Consumes: nothing (docs only).
- Produces: freeze-integrity evidence + updated "Catalog Ready" / "Measurable Catalog" definitions.

- [ ] **Step 1: Add the freeze change log entry**

In `docs/ai/M23_FREEZE_CHANGE_LOG.md`, replace the entries table row:

```md
| Date | Change | Why | Component | Baseline Contaminated? | Restart? | Author |
|---|---|---|---|---|---|---|
| — | *(none)* | — | — | — | — | — |
```
with:

```md
| Date | Change | Why | Component | Baseline Contaminated? | Restart? | Author |
|---|---|---|---|---|---|---|
| 2026-08-10 | Game Publishing Path (product/platform fix — STATUS.md issue #8): `POST /games/:slug/publish` sets `Game.isPublished`; public catalog/search filter `isPublished: true`; RELEASED auto-stamp removed | Root cause: no product path could publish a game, blocking catalog growth for M23 discovery data | Outside frozen M23 components — no algorithm/weights/metrics/rollout/CTR/baseline/embedding changes | NO | NO | AI Engineer |
```

- [ ] **Step 2: Update `M23_CATALOG_READINESS.md`**

In `docs/ai/M23_CATALOG_READINESS.md`, update the root-cause and readiness sections to reflect the fix:

- Change the "Readiness" verdict row from `🔴 PRODUCTION DATA PIPELINE ISSUE` to `🟢 PUBLISHING PATH AVAILABLE — catalog production is now possible via the product; measurable-catalog definition still pending production traffic`.
- In the root-cause section, add a line: `RESOLVED 2026-08-10 — Game Publishing Path shipped (POST /api/games/:slug/publish + public catalog/search isPublished filters). See docs/releases/M23_CATALOG_READINESS_CERTIFICATION.md.`
- Add a "Catalog Ready" definition: **Catalog Ready** = at least one real studio has published at least one real game through the product (evidence: `GET /api/games` returns non-zero `total` and the game's studio can re-fetch it as published).
- Add a "Measurable Catalog" definition: **UNDETERMINED** — requires real production traffic/history; thresholds are not invented (per Session 30 governance).

- [ ] **Step 3: Commit**

```bash
git add docs/ai/M23_FREEZE_CHANGE_LOG.md docs/ai/M23_CATALOG_READINESS.md
git commit -m "chore(ai): record publishing-path freeze entry and catalog readiness definitions"
```

---

## Task 11: Update platform documentation

**Files:**
- Modify: `ARCHITECTURE.md`
- Modify: `README.md`
- Modify: `STATUS.md`
- Modify: `docs/handoff/HANDOFF.md`
- Modify: `AGENTS.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: nothing (docs only).
- Produces: accurate documentation of the publishing path.

- [ ] **Step 1: Update `ARCHITECTURE.md`**

Add a short section (under the Games module or API endpoints list) describing:

- `POST /api/games/:slug/publish` (SessionAuthGuard, OWNER/ADMIN/MODERATOR, completeness gate, idempotent, transactional, audit `GAME_PUBLISHED`, EventBus `game_published` + feed `GAME_PUBLISHED` on real transition).
- Public catalog/search filter on `isPublished: true`; studio dashboard endpoints unaffected.
- `GameStatus` remains a dev-stage label — `isPublished` is the single public-visibility source of truth.

- [ ] **Step 2: Update `README.md`**

Add a line in the feature/API table: `Publishing — studios publish games via dashboard (completeness gate); public catalog/search only show published games. AI does not decide public visibility — publishing is a product/studio decision; AI works on already-eligible content.`

- [ ] **Step 3: Update `STATUS.md`**

- Move remaining issue #8 ("no publishing workflow") into a resolved/closed section: `#8 RESOLVED — Game Publishing Path shipped (2026-08-10).`
- If STATUS.md has an API/feature table, add the publish endpoint row.

- [ ] **Step 4: Update `docs/handoff/HANDOFF.md`**

Add a line in the API/features section: `Game publishing: POST /api/games/:slug/publish (authorized OWNER/ADMIN/MODERATOR, completeness gate, idempotent). Public catalog + search filter isPublished: true.`

- [ ] **Step 5: Update `AGENTS.md`**

Append a Session 31 entry (chronological history per AGENTS.md convention) summarizing: Game Publishing Path — new service, endpoint, catalog/search filters, frontend card, tests, and the explicit statement that no frozen M23 component was touched (freeze log entry added).

- [ ] **Step 6: Update `CHANGELOG.md`**

Add an entry under the current date: `Game Publishing Path — studios can publish games (POST /api/games/:slug/publish with completeness gate); public catalog/search show only published games; RELEASED status no longer auto-stamps publication metadata.`

- [ ] **Step 7: Commit**

```bash
git add ARCHITECTURE.md README.md STATUS.md docs/handoff/HANDOFF.md AGENTS.md CHANGELOG.md
git commit -m "docs: document game publishing path"
```

---

## Task 12: Final certification report + full verification

**Files:**
- Create: `docs/releases/M23_CATALOG_READINESS_CERTIFICATION.md`

**Interfaces:**
- Consumes: all previous tasks; verification evidence.
- Produces: the 18-section certification report with the honest split verdict (Publishing Path certified / M23 product impact not yet proven).

- [ ] **Step 1: Write the certification report**

Create `docs/releases/M23_CATALOG_READINESS_CERTIFICATION.md` with these sections (adapt from `docs/releases/M23_PRODUCTION_OBSERVATION_CERTIFICATION.md` style):

1. Executive summary
2. Scope (outside M23 freeze; product/platform fix, STATUS.md issue #8)
3. Root cause recap (no product path set `isPublished`)
4. Changes shipped (per task — endpoint, service, filters, frontend, tests)
5. Security (auth matrix, completeness gate, idempotency, forged-payload rejection, no DTO field)
6. Freeze integrity (M23_FREEZE_CHANGE_LOG entry; no frozen component touched)
7. Test evidence (games spec: publish block + rewritten catalog tests; full suite count before/after)
8. Quality gates (`pnpm verify` output; lint; typecheck)
9. Known limitations (public game page still open by slug — follow-up; no unpublish; no moderation workflow)
10. M23 relationship (feed/economy events now fire on real publish; embedding pipeline consumer unchanged)
11. Metrics (N/A this sprint — no data fabrication)
12. Verdict — **Catalog Publishing Path: CERTIFIED**; **M23 Product Impact: NOT YET PROVEN** (requires real catalog + 7-day window)
13. Follow-ups (public page draft gating, unpublish, moderation)

- [ ] **Step 2: Run the full API test suite**

```bash
pnpm --filter @playmorrow/api test:db:up
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/playmorrow_test?schema=public pnpm --filter @playmorrow/api test
```

Expected: 0 failures (pre-existing suite count + new publish tests). Note the pre-existing AI-module spec status per STATUS.md — do not chase unrelated failures unless this sprint caused them.

- [ ] **Step 3: Run `pnpm verify` (root)**

```bash
pnpm verify
```

Expected: lint 0 errors, typecheck all workspaces green, build green.

- [ ] **Step 4: Verify no schema drift**

Run: `git status --short`
Expected: only the plan's files changed. Confirm `packages/database/prisma/schema.prisma` is NOT in the diff. Run `pnpm --filter @playmorrow/database db:status` if available and confirm no pending migrations.

- [ ] **Step 5: Commit**

```bash
git add docs/releases/M23_CATALOG_READINESS_CERTIFICATION.md
git commit -m "docs: certify catalog publishing path (M23 readiness prerequisite)"
```

---

## Self-Review Checklist (run by the plan author before execution)

1. **Spec coverage:** §6.1 (Task 1) · §6.2 (Task 3) · §6.3 (Task 4) · §6.4 (Task 3 transaction) · §6.5 (Task 3 events) · §6.6 (Tasks 5-6) · §7 (Tasks 7-8) · §8 (Task 9 auth/forged tests) · §9 (Task 9) · §10 (Task 10) · §11 (Task 11) · §12 (Task 12) · §13 out-of-scope respected · §14 success criteria (Tasks 9-12 verification).
2. **Placeholder scan:** every code step contains complete code; no TBD/TODO.
3. **Type consistency:** `MissingRequirementKey`, `validateGamePublicationReadiness`, `publishGame(userId, slug)`, `GAME_INCLUDE`, `toResponse`, `usePublishGame`, `PUBLICATION_REQUIREMENTS` — names match across tasks.
4. **Test DB requirement:** all e2e commands use `TEST_DATABASE_URL=...:5433`; docker compose `postgres-test` is the source of truth.

---

## Definition of Done

- `POST /api/games/:slug/publish` live; auth/readiness/idempotency/CANCELLED enforced server-side.
- `GET /api/games` and `GET /api/search` games branch return only published games; drafts isolated (proven by tests).
- Frontend Publication card + `usePublishGame()` on the editor page.
- RELEASED no longer auto-stamps `publishedBy`/`publishedAt`.
- Audit + EventBus + feed events fire only on the real `false → true` transition.
- No schema change, no migration, no frozen M23 component touched (freeze log entry present).
- `pnpm verify` green; full API suite green against :5433; certification report written with the honest split verdict.



