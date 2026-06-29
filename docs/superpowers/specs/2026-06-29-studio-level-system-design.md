# Studio Level & XP System Design

## Overview

A professional studio leveling system that tracks quality and engagement through experience points (XP). Studios earn XP through meaningful actions — creating content, building community, and achieving milestones. Levels are displayed on the studio's public page, dashboard sidebar, and edit page as a credibility signal to attract other indie studios to the platform.

## Architecture

### Database Schema Changes

**Add to `Studio` model:**
```prisma
level        Int      @default(1)
xp           Int      @default(0)
totalXpEarned Int     @default(0)
```

**New model:**
```prisma
model StudioXpEvent {
  id        String   @id @default(cuid())
  studioId  String
  type      String   // e.g. 'FOLLOW', 'DEVLOG_PUBLISH', 'GAME_CREATE', 'GAME_RELEASE', 'COMMENT_RECEIVED', 'WISHLIST', 'PROFILE_COMPLETE', 'REACTION'
  amount    Int
  sourceId  String?  // optional ref to the entity that triggered it (gameId, devlogId, etc.)
  createdAt DateTime @default(now())

  studio Studio @relation(fields: [studioId], references: [id], onDelete: Cascade)

  @@index([studioId])
  @@index([studioId, createdAt])
  @@map("studio_xp_events")
}
```

### XP Service

New service `StudioXpService` with a single public method:

```
award(studioSlug: string, type: XpEventType, amount: number, sourceId?: string): Promise<{ levelUp: boolean; newLevel: number }>
```

Called from existing controllers after successful actions. Calculates new total, checks level-up threshold, logs event, optionally fires a notification.

## XP Earning Rules

### XP Sources & Values

| Category | Action | XP | Frequency | Notes |
|---|---|---|---|---|
| **Profile** | Complete studio profile (all 7 fields) | 40 | One-time | Based on profile strength = 100% |
| **Content** | Create a game | 50 | Per game | |
| | Publish a devlog | 25 | Per devlog | |
| | Update roadmap (add item) | 15 | Per item | |
| | Set up press kit | 40 | One-time | |
| | Add platform link | 10 | Per link | |
| | Upload screenshot/media | 10 | Per media item | |
| **Community** | Receive a follower | 5 | Per follower | Daily cap: 200 XP |
| | Receive a game wishlist | 3 | Per wishlist | Daily cap: 200 XP |
| | Receive a comment on devlog | 5 | Per comment | Daily cap: 200 XP |
| | Receive a comment on game | 5 | Per comment | Daily cap: 200 XP |
| | Receive a reaction on devlog | 3 | Per reaction | Daily cap: 200 XP |
| **Milestone** | Game reaches BETA status | 50 | Per game | |
| | Game reaches RELEASED status | 100 | Per game | |
| | Studio reaches 100 followers | 25 | One-time | |
| | Studio reaches 500 followers | 50 | One-time | |
| | Game reaches 100 wishlists | 30 | One-time | |
| | Game reaches 1,000 wishlists | 75 | One-time | |

### Anti-Abuse

- **Daily cap**: Community engagement XP (follow, wishlist, comment, reaction) is capped at 200 XP per day total to prevent farm/grind
- **One-time only**: Profile completion, press kit, platform links give XP only once
- **No self-XP**: Following your own studio, commenting on your own content gives 0 XP
- **Content XP is per-item**: Each game/devlog/media item gives XP only once

### Level Thresholds

```
Level N → N+1 requires N × 100 XP
Total XP for Level N = (N × (N−1) / 2) × 100  (0 for Level 1)
```

| Level | Total XP Needed | XP to Next Level | Title |
|---|---|---|---|
| 1 | 0 | 100 | Rising |
| 2 | 100 | 200 | Rising |
| 5 | 1,000 | 500 | Active |
| 10 | 4,500 | 1,000 | Active |
| 15 | 10,500 | 1,500 | Professional |
| 20 | 19,000 | 2,000 | Professional |
| 25 | 30,000 | 2,500 | Renowned |
| 30 | 43,500 | 3,000 | Renowned |
| 40 | 78,000 | 4,000 | Legendary |
| 50 | 122,500 | 5,000 | Legendary |

**Title Tiers:**
- Level 1–5: Rising
- Level 6–15: Active
- Level 16–30: Professional
- Level 31–45: Renowned
- Level 46–50: Legendary

## Implementation Plan

### Phase 1: Backend

1. Add Prisma migration for `Studio.level`, `Studio.xp`, `Studio.totalXpEarned`, and `StudioXpEvent` model
2. Create `StudioXpService` with `award()` method, level-up detection, daily cap logic
3. Add XP awards to existing controllers:
   - `StudiosController.follow()` → award FOLLOW
   - `GamesController.create()` → award GAME_CREATE
   - `GamesController.update()` → award GAME_RELEASE/GAME_BETA on status change
   - `DevlogsController.create()` → award DEVLOG_PUBLISH
   - `RoadmapItemsController.create()` → award ROADMAP_UPDATE
   - `CommentsController.create()` → award COMMENT
   - `ReactionsController.create()` → award REACTION
   - `WishlistItemsController.create()` → award WISHLIST
   - `StudiosController.update()` → award PROFILE_COMPLETE on 100% profile strength
4. Include `level`, `xp` in all Studio API responses
5. Add `StudioXpEventsController` with GET endpoint for activity log (optional)

### Phase 2: Seed Data

1. Update seed script to award XP for existing studios based on their current data:
   - +40 for complete profiles
   - +50 per game
   - +25 per devlog
   - +15 per roadmap item
   - +5 per follower
   - +100 per released game
2. Calculate initial levels from total XP

### Phase 3: Frontend

1. Replace hardcoded "Level 12" / "8,750 / 12,000 XP" in:
   - `StudioDashboard.tsx`
   - Edit studio page sidebar
2. Use real `studio.level` and `studio.xp` from API response
3. Calculate `xpForNextLevel = (studio.level + 1) * 100`
4. Calculate `totalXpForLevel = (studio.level * (studio.level - 1) / 2) * 100`
5. Progress bar: `((studio.xp - totalXpForLevel) / (studio.level * 100)) * 100`
6. Add level-up toast notification (optional)
7. Show level + title on public studio page

### Phase 4: Retroactive XP for Existing Studios

Run a one-time script to calculate and award XP for all existing data (games, devlogs, followers, etc.) so existing studios aren't starting at Level 1 with 0 XP.

## Future Considerations

- **Level perks**: Unlock features at certain levels (custom profile themes, analytics access, priority support)
- **Badge system**: Award visual badges for achievements (not tied to level)
- **Player levels**: Extend similar system to Player accounts
- **XP decay**: Reduce XP for inactive studios over time (long-term)
