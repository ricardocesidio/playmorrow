# Studio Level & XP System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a real studio level/XP system with Prisma migration, XP service, retroactive calculation, live XP awards from existing actions, and a frontend explanation page.

**Architecture:** New `StudioXpService` called from existing service methods after successful actions. Prisma migration adds `level`/`xp` to `Studio` model and a `StudioXpEvent` audit table. Frontend replaces hardcoded mock values with real API data and adds a level explanation page.

**Tech Stack:** NestJS 11, Prisma, Next.js 15 App Router, TanStack Query

## Global Constraints

- Prisma schema changes must use `cuid()` for all `@id` fields
- `@@map("studio_xp_events")` for the new model
- `Studio.level` defaults to `1`, `Studio.xp` defaults to `0`
- All XP awards happen in **service methods**, not controllers
- XP award format: `studioXpService.award(studioId, type, amount, sourceId?)`
- New accounts start with `level: 1`, `xp: 0`, no followers, no content — clean state
- XP values from spec: CREATE_GAME=50, DEVLOG_PUBLISH=25, FOLLOW=5, etc.
- Daily cap: 200 XP from community types (FOLLOW, WISHLIST, COMMENT, REACTION) in rolling 24h

---

### Task 1: Prisma Migration — Add level/xp + StudioXpEvent

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

- [ ] **Step 1: Add fields to Studio model**

```prisma
model Studio {
  id          String   @id @default(cuid())
  // ... existing fields ...
  level        Int      @default(1)
  xp           Int      @default(0)
  // ... rest of existing fields ...
}
```

- [ ] **Step 2: Add StudioXpEvent model**

```prisma
model StudioXpEvent {
  id        String   @id @default(cuid())
  studioId  String
  type      String
  amount    Int
  sourceId  String?
  createdAt DateTime @default(now())

  studio Studio @relation(fields: [studioId], references: [id], onDelete: Cascade)

  @@index([studioId])
  @@index([studioId, createdAt])
  @@map("studio_xp_events")
}
```

- [ ] **Step 3: Run the migration**

```bash
pnpm --filter @playmorrow/database prisma:migrate --name add_studio_level_xp
```

- [ ] **Step 4: Regenerate Prisma client**

```bash
pnpm --filter @playmorrow/database prisma:generate
```

- [ ] **Step 5: Build API to verify no type errors**

```bash
pnpm --filter @playmorrow/api build 2>&1 | tail -5
```

Expected: `$ nest build` with no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/database/
git commit -m "feat: add Studio.level, Studio.xp, StudioXpEvent model"
```

---

### Task 2: Create StudioXpService

**Files:**
- Create: `apps/api/src/studios/studio-xp.service.ts`
- Modify: `apps/api/src/studios/studios.module.ts`

- [ ] **Step 1: Create StudioXpService**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@playmorrow/database';

export type XpEventType =
  | 'PROFILE_COMPLETE'
  | 'GAME_CREATE'
  | 'GAME_RELEASE'
  | 'GAME_BETA'
  | 'DEVLOG_PUBLISH'
  | 'ROADMAP_UPDATE'
  | 'PRESS_KIT'
  | 'PLATFORM_LINK'
  | 'MEDIA_UPLOAD'
  | 'FOLLOW'
  | 'WISHLIST'
  | 'COMMENT'
  | 'REACTION'
  | 'FOLLOWER_MILESTONE_100'
  | 'FOLLOWER_MILESTONE_500'
  | 'WISHLIST_MILESTONE_100'
  | 'WISHLIST_MILESTONE_1000';

const COMMUNITY_TYPES: XpEventType[] = ['FOLLOW', 'WISHLIST', 'COMMENT', 'REACTION'];

const XP_VALUES: Record<XpEventType, number> = {
  PROFILE_COMPLETE: 40,
  GAME_CREATE: 50,
  GAME_RELEASE: 100,
  GAME_BETA: 50,
  DEVLOG_PUBLISH: 25,
  ROADMAP_UPDATE: 15,
  PRESS_KIT: 40,
  PLATFORM_LINK: 10,
  MEDIA_UPLOAD: 10,
  FOLLOW: 5,
  WISHLIST: 3,
  COMMENT: 5,
  REACTION: 3,
  FOLLOWER_MILESTONE_100: 25,
  FOLLOWER_MILESTONE_500: 50,
  WISHLIST_MILESTONE_100: 30,
  WISHLIST_MILESTONE_1000: 75,
};

const DAILY_CAP = 200;

@Injectable()
export class StudioXpService {
  constructor(private prisma: PrismaService) {}

  async award(
    studioId: string,
    type: XpEventType,
    amount?: number,
    sourceId?: string,
  ): Promise<{ levelUp: boolean; newLevel: number }> {
    const xpAmount = amount ?? XP_VALUES[type];

    // Check daily cap for community types
    if (COMMUNITY_TYPES.includes(type)) {
      const capReached = await this.checkDailyCap(studioId);
      if (capReached) return { levelUp: false, newLevel: 0 };
    }

    // Log event
    await this.prisma.studioXpEvent.create({
      data: {
        studioId,
        type,
        amount: xpAmount,
        sourceId,
      },
    });

    // Update studio XP
    const studio = await this.prisma.studio.update({
      where: { id: studioId },
      data: { xp: { increment: xpAmount } },
    });

    // Check level-up
    const newLevel = this.calculateLevel(studio.xp);
    const levelUp = newLevel > studio.level;

    if (levelUp) {
      await this.prisma.studio.update({
        where: { id: studioId },
        data: { level: newLevel },
      });
    }

    return { levelUp, newLevel: levelUp ? newLevel : studio.level };
  }

  private async checkDailyCap(studioId: string): Promise<boolean> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await this.prisma.studioXpEvent.aggregate({
      where: {
        studioId,
        type: { in: COMMUNITY_TYPES },
        createdAt: { gte: since },
      },
      _sum: { amount: true },
    });
    const total = result._sum.amount ?? 0;
    return total >= DAILY_CAP;
  }

  calculateLevel(xp: number): number {
    // Level N requires cumulative XP = (N * (N-1) / 2) * 100
    // Solve N from xp: N = floor((1 + sqrt(1 + 8 * xp / 100)) / 2)
    const n = Math.floor((1 + Math.sqrt(1 + (8 * xp) / 100)) / 2);
    return Math.max(1, n);
  }
}
```

- [ ] **Step 2: Register StudioXpService in StudiosModule**

```typescript
// In studios.module.ts, add StudioXpService to providers and export it
import { StudioXpService } from './studio-xp.service';

@Module({
  imports: [PrismaModule, AuthModule, forwardRef(() => GamesModule)],
  controllers: [StudiosController],
  providers: [StudiosService, StudioXpService],
  exports: [StudiosService, StudioXpService],
})
export class StudiosModule {}
```

- [ ] **Step 3: Build to verify**

```bash
pnpm --filter @playmorrow/api build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/studios/studio-xp.service.ts apps/api/src/studios/studios.module.ts
git commit -m "feat: create StudioXpService with award, daily cap, level calculation"
```

---

### Task 3: Add XP Awards to Existing Service Methods

**Files:**
- Modify: `apps/api/src/studios/studios.service.ts`
- Modify: `apps/api/src/games/games.service.ts`
- Modify: `apps/api/src/devlogs/devlogs.service.ts`
- Modify: `apps/api/src/roadmap-items/roadmap-items.service.ts`
- Modify: `apps/api/src/comments/comments.service.ts`
- Modify: `apps/api/src/reactions/reactions.service.ts`
- Modify: `apps/api/src/wishlist/wishlist.service.ts`
- Modify: `apps/api/src/follows/follows.service.ts`

For each service:
1. Inject `StudioXpService` via constructor
2. After successful creation/action, call `this.studioXpService.award(studioId, type, undefined, sourceId)`
3. For games/studios: resolve the studio ID from the slug/find query
4. For comments on devlogs: resolve the game's studio from the devlog
5. For reactions: resolve the devlog's game's studio
6. For follows: use the target studio's ID directly
7. For wishlists: resolve the game's studio

Key patterns:

**StudiosService.create:**
Award `PROFILE_COMPLETE` after studio creation (only if all 7 profile fields are non-null).

**StudiosService.follow:**
Award `FOLLOW` after successful follow insert.

**GamesService.create:**
Award `GAME_CREATE` after game creation. On update with status change to BETA → `GAME_BETA`, RELEASED → `GAME_RELEASE`.

**DevlogsService.create:**
Award `DEVLOG_PUBLISH` only when `dto.isPublished === true`.

**RoadmapItemsService.create:**
Award `ROADMAP_UPDATE` after item creation.

**CommentsService.create and createForGame:**
Award `COMMENT` after comment creation.

**ReactionsService.reactToDevlog:**
Award `REACTION` after reaction creation.

**WishlistService.add:**
Award `WISHLIST` after wishlist addition.

**Milestone checks (after follower/wishlist count increments):**
In `follows.service.ts` followStudio: after incrementing `studio.followersCount`, check if it crosses 100 or 500 and award milestone if no existing event.

```typescript
// Pattern for milestone check (in follows.service.ts after successful follow)
const studio = await this.prisma.studio.findUnique({ where: { slug } });
if (studio) {
  const milestones = [100, 500];
  for (const m of milestones) {
    if (studio.followersCount === m) {
      const existing = await this.prisma.studioXpEvent.findFirst({
        where: { studioId: studio.id, type: m === 100 ? 'FOLLOWER_MILESTONE_100' : 'FOLLOWER_MILESTONE_500' },
      });
      if (!existing) {
        await this.studioXpService.award(studio.id, m === 100 ? 'FOLLOWER_MILESTONE_100' : 'FOLLOWER_MILESTONE_500');
      }
    }
  }
}
```

Similar pattern for wishlist milestones in `wishlist.service.ts`.

- [ ] **Build to verify**

```bash
pnpm --filter @playmorrow/api build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Commit**

```bash
git add apps/api/src/
git commit -m "feat: add XP awards to studios, games, devlogs, roadmap, comments, reactions, wishlist, follows"
```

---

### Task 4: Include level/xp in Studio API Responses

**Files:**
- Modify: `apps/web/lib/api/client.ts` — add `level` and `xp` to `Studio` interface

- [ ] **Step 1: Add level/xp to Studio interface**

```typescript
export interface Studio {
  // ... existing fields ...
  level: number;
  xp: number;
}
```

- [ ] **Step 2: Verify the Studio type is used consistently**

Check that `useStudio(slug)`, `useMyStudios()`, and other studio queries will include the new fields. The backend already returns all fields from the Prisma model, so `level` and `xp` will be included automatically.

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/api/client.ts
git commit -m "feat: add level and xp to Studio type"
```

---

### Task 5: Retroactive XP Calculation Script

**Files:**
- Create: `apps/api/src/scripts/recalculate-xp.ts`

- [ ] **Step 1: Create the recalculate script**

```typescript
import { PrismaClient } from '@playmorrow/database';

const prisma = new PrismaClient();

async function recalculateXp() {
  const studios = await prisma.studio.findMany({
    include: {
      games: { include: { devlogs: true, roadmapItems: true } },
      followers: true,
    },
  });

  for (const studio of studios) {
    let totalXp = 0;
    const events: Array<{ type: string; amount: number; sourceId?: string }> = [];

    // Profile completeness
    const fields = [studio.name, studio.tagline, studio.description, studio.logoUrl, studio.bannerUrl, studio.websiteUrl, studio.location];
    if (fields.every(Boolean)) {
      totalXp += 40;
      events.push({ type: 'PROFILE_COMPLETE', amount: 40 });
    }

    // Games
    for (const game of studio.games) {
      totalXp += 50;
      events.push({ type: 'GAME_CREATE', amount: 50, sourceId: game.id });

      if (game.status === 'BETA') {
        totalXp += 50;
        events.push({ type: 'GAME_BETA', amount: 50, sourceId: game.id });
      }
      if (game.status === 'RELEASED') {
        totalXp += 100;
        events.push({ type: 'GAME_RELEASE', amount: 100, sourceId: game.id });
      }

      // Devlogs
      for (const devlog of game.devlogs) {
        if (devlog.isPublished) {
          totalXp += 25;
          events.push({ type: 'DEVLOG_PUBLISH', amount: 25, sourceId: devlog.id });
        }
      }

      // Roadmap items
      for (const item of game.roadmapItems) {
        totalXp += 15;
        events.push({ type: 'ROADMAP_UPDATE', amount: 15, sourceId: item.id });
      }
    }

    // Followers
    totalXp += studio.followersCount * 5;
    if (studio.followersCount >= 100) {
      events.push({ type: 'FOLLOWER_MILESTONE_100', amount: 25 });
      totalXp += 25;
    }
    if (studio.followersCount >= 500) {
      events.push({ type: 'FOLLOWER_MILESTONE_500', amount: 50 });
      totalXp += 50;
    }

    // Calculate level
    const level = Math.max(1, Math.floor((1 + Math.sqrt(1 + (8 * totalXp) / 100)) / 2));

    // Update studio
    await prisma.studio.update({
      where: { id: studio.id },
      data: { xp: totalXp, level },
    });

    // Insert events (skip duplicates for already-existing events)
    for (const event of events) {
      const existing = await prisma.studioXpEvent.findFirst({
        where: { studioId: studio.id, type: event.type, sourceId: event.sourceId ?? null },
      });
      if (!existing) {
        await prisma.studioXpEvent.create({
          data: { studioId: studio.id, type: event.type, amount: event.amount, sourceId: event.sourceId },
        });
      }
    }

    console.log(`Studio ${studio.slug}: Level ${level}, ${totalXp} XP`);
  }

  await prisma.$disconnect();
}

recalculateXp().catch(console.error);
```

- [ ] **Step 2: Add a script entry to package.json**

```json
// In apps/api/package.json
{
  "scripts": {
    "xp:recalculate": "npx ts-node src/scripts/recalculate-xp.ts"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/scripts/ apps/api/package.json
git commit -m "feat: add retroactive XP calculation script"
```

---

### Task 6: Replace Hardcoded Level/XP in Frontend

**Files:**
- Modify: `apps/web/components/dashboard/StudioDashboard.tsx`
- Modify: `apps/web/app/dashboard/studios/[slug]/page.tsx`

- [ ] **Step 1: Update StudioDashboard.tsx**

Replace the hardcoded `studioLevel={12}` and progress values with real data from the studio query:

```typescript
// In StudioDashboard.tsx, where StudioHero is rendered:
// Find where studio level is fetched — the studio object already includes level and xp
// Use real values:
const xpAtStart = (studio.level * (studio.level - 1) / 2) * 100;
const xpForNext = studio.level * 100;
const progress = ((studio.xp - xpAtStart) / xpForNext) * 100;

// Replace hardcoded ProgressBar value and XP text
<ProgressBar value={progress} className="mt-3" />
<p className="mt-2 text-right font-mono text-[0.62rem] text-muted-foreground">
  {studio.xp.toLocaleString()} / {xpForNext.toLocaleString()} XP
</p>
```

The `StudioSidebar` currently accepts `studioLevel` as a prop. Update the parent to pass `studio.level` instead of `12`.

- [ ] **Step 2: Update edit studio page sidebar**

In `apps/web/app/dashboard/studios/[slug]/page.tsx`, lines 172-175 (hardcoded Level 12 / 73% / XP text), replace with real `studio.level` and `studio.xp`:

```typescript
{studio && (
  <>
    <div className="mt-5 border-t border-border/70 px-2 pt-4">
      <p className="font-mono text-[0.67rem] uppercase tracking-[0.22em] text-muted-foreground">Studio Level</p>
      <p className="mt-1 font-mono text-xs text-cyan">Level {studio.level}</p>
      {(() => {
        const xpAtStart = (studio.level * (studio.level - 1) / 2) * 100;
        const xpForNext = studio.level * 100;
        const progress = Math.min(((studio.xp - xpAtStart) / xpForNext) * 100, 100);
        return (
          <>
            <div className="mt-3 h-1.5 bg-border/40">
              <div className="h-full bg-cyan shadow-[0_0_12px_rgb(62_231_255_/_0.7)] transition-all duration-700"
                style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-right font-mono text-[0.62rem] text-muted-foreground">
              {studio.xp.toLocaleString()} / {xpForNext.toLocaleString()} XP
            </p>
          </>
        );
      })()}
    </div>
  </>
)}
```

- [ ] **Step 3: Build frontend**

```bash
pnpm --filter @playmorrow/web build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/
git commit -m "feat: replace hardcoded level/XP with real data from API"
```

---

### Task 7: Create Level System Explanation Page

**Files:**
- Create: `apps/web/app/dashboard/studios/level/page.tsx`

- [ ] **Step 1: Create the level explanation page**

```typescript
'use client';

import Link from 'next/link';
import { ArrowLeft, Award, TrendingUp, Users, MessageSquare, Heart, Star, Code, Play, BookOpen, ListChecks, Link2, Image, Crown, Shield, Zap, Timer } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';

const XP_TABLE = [
  { category: 'Profile', icon: <Award className="size-4" />, actions: [
    { action: 'Complete studio profile (all 7 fields)', xp: 40, freq: 'One-time' },
  ]},
  { category: 'Content', icon: <Code className="size-4" />, actions: [
    { action: 'Create a game', xp: 50, freq: 'Per game' },
    { action: 'Publish a devlog', xp: 25, freq: 'Per devlog' },
    { action: 'Update roadmap (add item)', xp: 15, freq: 'Per item' },
    { action: 'Set up press kit', xp: 40, freq: 'One-time' },
    { action: 'Add platform link', xp: 10, freq: 'Per link' },
    { action: 'Upload screenshot/media', xp: 10, freq: 'Per media item' },
  ]},
  { category: 'Community', icon: <Heart className="size-4" />, actions: [
    { action: 'Receive a follower', xp: 5, freq: 'Per follower' },
    { action: 'Receive a game wishlist', xp: 3, freq: 'Per wishlist' },
    { action: 'Receive a comment', xp: 5, freq: 'Per comment' },
    { action: 'Receive a reaction', xp: 3, freq: 'Per reaction' },
  ]},
  { category: 'Milestones', icon: <Star className="size-4" />, actions: [
    { action: 'Game reaches BETA', xp: 50, freq: 'Per game' },
    { action: 'Game reaches RELEASED', xp: 100, freq: 'Per game' },
    { action: 'Studio reaches 100 followers', xp: 25, freq: 'One-time' },
    { action: 'Studio reaches 500 followers', xp: 50, freq: 'One-time' },
    { action: 'Game reaches 100 wishlists', xp: 30, freq: 'One-time' },
    { action: 'Game reaches 1,000 wishlists', xp: 75, freq: 'One-time' },
  ]},
];

const LEVEL_TABLE = [
  { level: 1, totalXp: 0, nextXp: 100, title: 'Rising' },
  { level: 5, totalXp: 1000, nextXp: 500, title: 'Active' },
  { level: 10, totalXp: 4500, nextXp: 1000, title: 'Active' },
  { level: 15, totalXp: 10500, nextXp: 1500, title: 'Professional' },
  { level: 20, totalXp: 19000, nextXp: 2000, title: 'Professional' },
  { level: 25, totalXp: 30000, nextXp: 2500, title: 'Renowned' },
  { level: 30, totalXp: 43500, nextXp: 3000, title: 'Renowned' },
  { level: 40, totalXp: 78000, nextXp: 4000, title: 'Legendary' },
  { level: 50, totalXp: 122500, nextXp: 5000, title: 'Legendary' },
];

const TITLE_RANGES = [
  { min: 1, max: 5, title: 'Rising', icon: <Zap className="size-5" />, color: 'text-cyan', desc: 'Fresh on the scene — just getting started.' },
  { min: 6, max: 15, title: 'Active', icon: <TrendingUp className="size-5" />, color: 'text-emerald', desc: 'Building presence — actively developing and engaging.' },
  { min: 16, max: 30, title: 'Professional', icon: <Shield className="size-5" />, color: 'text-violet', desc: 'Established operation — multiple games, strong community.' },
  { min: 31, max: 45, title: 'Renowned', icon: <Crown className="size-5" />, color: 'text-amber', desc: 'Industry respected — significant releases and following.' },
  { min: 46, max: 50, title: 'Legendary', icon: <Star className="size-5" />, color: 'text-rose', desc: 'Top tier — the best of the best on Playmorrow.' },
];

export default function StudioLevelPage() {
  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:text-cyan">
            <ArrowLeft className="size-3" /> Back to dashboard
          </Link>

          <div className="mb-10">
            <h1 className="font-display text-4xl font-black uppercase tracking-tight text-white">Studio Level System</h1>
            <p className="mt-3 max-w-2xl font-mono text-[0.72rem] leading-relaxed text-muted-foreground">
              Level up your studio by creating content, engaging the community, and reaching milestones.
              Higher levels unlock credibility signals that help attract players, press, and publishing partners.
            </p>
          </div>

          {/* Title Tiers */}
          <section className="mb-12">
            <h2 className="mb-5 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-cyan">Title Tiers</h2>
            <div className="grid gap-3 sm:grid-cols-5">
              {TITLE_RANGES.map(tier => (
                <div key={tier.title} className="clip-corner border border-border/70 bg-[#050b0f]/80 p-4 text-center shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
                  <div className={`mx-auto mb-2 ${tier.color}`}>{tier.icon}</div>
                  <p className={`font-display text-sm font-bold ${tier.color}`}>{tier.title}</p>
                  <p className="mt-0.5 font-mono text-[0.55rem] text-muted-foreground">Lv.{tier.min}–{tier.max}</p>
                  <p className="mt-1.5 font-mono text-[0.55rem] text-muted-foreground leading-relaxed">{tier.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How XP Is Earned */}
          <section className="mb-12">
            <h2 className="mb-5 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-cyan">How XP Is Earned</h2>
            <div className="space-y-4">
              {XP_TABLE.map(group => (
                <div key={group.category} className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
                  <div className="mb-3 flex items-center gap-2 border-b border-border/60 pb-2">
                    <span className="text-cyan">{group.icon}</span>
                    <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan">{group.category}</h3>
                  </div>
                  <div className="space-y-1.5">
                    {group.actions.map(a => (
                      <div key={a.action} className="flex items-center justify-between font-mono text-[0.6rem]">
                        <span className="text-foreground">{a.action}</span>
                        <span className="text-cyan">+{a.xp} XP <span className="text-muted-foreground">({a.freq})</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Anti-Abuse */}
          <section className="mb-12">
            <h2 className="mb-5 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-cyan">Fair Play Rules</h2>
            <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Timer className="mt-0.5 size-4 shrink-0 text-coral" />
                  <div>
                    <p className="font-mono text-[0.62rem] font-semibold text-foreground">Daily Cap</p>
                    <p className="font-mono text-[0.58rem] text-muted-foreground">Community XP (follows, wishlists, comments, reactions) is capped at 200 XP per 24-hour rolling window to prevent farming.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="mt-0.5 size-4 shrink-0 text-coral" />
                  <div>
                    <p className="font-mono text-[0.62rem] font-semibold text-foreground">No Self-XP</p>
                    <p className="font-mono text-[0.58rem] text-muted-foreground">Following your own studio, commenting on your own content, or wishlisting your own games gives 0 XP.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="mt-0.5 size-4 shrink-0 text-coral" />
                  <div>
                    <p className="font-mono text-[0.62rem] font-semibold text-foreground">One-Time Only</p>
                    <p className="font-mono text-[0.58rem] text-muted-foreground">Profile completion, press kit setup, and platform links give XP only once — no repeats for edits.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Level Table */}
          <section className="mb-12">
            <h2 className="mb-5 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-cyan">Level Thresholds</h2>
            <div className="clip-corner overflow-hidden border border-border/70 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
              <table className="w-full font-mono text-[0.6rem]">
                <thead>
                  <tr className="border-b border-border/60 bg-[#050b0f]">
                    <th className="px-4 py-3 text-left text-cyan uppercase tracking-wider">Level</th>
                    <th className="px-4 py-3 text-left text-cyan uppercase tracking-wider">Total XP</th>
                    <th className="px-4 py-3 text-left text-cyan uppercase tracking-wider">XP to Next</th>
                    <th className="px-4 py-3 text-left text-cyan uppercase tracking-wider">Title</th>
                  </tr>
                </thead>
                <tbody>
                  {LEVEL_TABLE.map(row => (
                    <tr key={row.level} className="border-b border-border/40 bg-[#050b0f]/50">
                      <td className="px-4 py-2.5 font-semibold text-cyan">{row.level}</td>
                      <td className="px-4 py-2.5 text-foreground">{row.totalXp.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{row.nextXp.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-foreground">{row.title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Level Up Benefits */}
          <section className="mb-12">
            <h2 className="mb-5 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-cyan">What Levels Unlock</h2>
            <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="border border-border/50 bg-background/30 p-4">
                  <p className="font-mono text-[0.65rem] font-semibold text-cyan">Level 5+</p>
                  <p className="mt-1 font-mono text-[0.58rem] text-muted-foreground">Title changes from "Rising" to "Active" — visible on your studio profile.</p>
                </div>
                <div className="border border-border/50 bg-background/30 p-4">
                  <p className="font-mono text-[0.65rem] font-semibold text-cyan">Level 16+</p>
                  <p className="mt-1 font-mono text-[0.58rem] text-muted-foreground">"Professional" title — signals established operation to visitors.</p>
                </div>
                <div className="border border-border/50 bg-background/30 p-4">
                  <p className="font-mono text-[0.65rem] font-semibold text-cyan">Level 31+</p>
                  <p className="mt-1 font-mono text-[0.58rem] text-muted-foreground">"Renowned" title — sets you apart as an industry-recognized studio.</p>
                </div>
                <div className="border border-border/50 bg-background/30 p-4">
                  <p className="font-mono text-[0.65rem] font-semibold text-cyan">Level 46+</p>
                  <p className="mt-1 font-mono text-[0.58rem] text-muted-foreground">"Legendary" title — the highest tier, reserved for the most accomplished studios.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Clean State Note */}
          <section className="mb-12">
            <h2 className="mb-5 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-cyan">Starting Fresh</h2>
            <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
              <p className="font-mono text-[0.6rem] leading-relaxed text-muted-foreground">
                Every new studio starts at <span className="text-cyan">Level 1</span> with <span className="text-cyan">0 XP</span>.
                No followers, no games, no devlogs — a completely clean slate.
                Start by completing your studio profile, then create your first game to begin earning XP.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/dashboard/studios/level/page.tsx
git commit -m "feat: create studio level system explanation page"
```

---

### Task 8: Add Level System Link to Sidebars

**Files:**
- Modify: `apps/web/components/dashboard/StudioDashboard.tsx`
- Modify: `apps/web/app/dashboard/studios/[slug]/page.tsx`

- [ ] **Step 1: Add link to StudioDashboard sidebar**

Add after the "Payouts" nav link (line 238) and before "Settings":

```typescript
<SidebarLink href="/dashboard/studios/level" icon={<Award className="size-4" />} label="Level System" />
```

Import `Award` from `lucide-react` at the top.

- [ ] **Step 2: Add link to edit studio page sidebar**

In `apps/web/app/dashboard/studios/[slug]/page.tsx`, find the nav links section (around line 152-163) and add after "Payouts":

```typescript
{ href: '/dashboard/studios/level', icon: <Award className="size-4" />, label: 'Level System' },
```

Import `Award` from `lucide-react` at the top.

- [ ] **Step 3: Build frontend**

```bash
pnpm --filter @playmorrow/web build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/
git commit -m "feat: add Level System link to both studio sidebars"
```

