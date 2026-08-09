import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface TasteSignalGame {
  gameId: string;
  title: string;
  signal: number;
  source: 'wishlist' | 'follow' | 'purchase' | 'view';
}

export interface TasteSignals {
  signalGames: TasteSignalGame[];
  tagAffinity: Map<string, number>;
  followedStudioIds: string[];
  signalTexts: string[];
}

const SIGNAL_WEIGHTS: Record<TasteSignalGame['source'], number> = {
  wishlist: 1.0,
  purchase: 1.0,
  follow: 0.8,
  view: 0.2,
};

const VIEW_CAP = 12;
const SIGNAL_GAME_CAP = 12;
const TAG_AFFINITY_DECAY = 0.85;

/**
 * Deterministic taste-signal gathering for the M23 hybrid recommender.
 * Signals are explicit (wishlist, follow, purchase) or implicit (page views),
 * each with a fixed weight. No user text content is ever embedded — only
 * the public titles of the user's signal games (AI Constitution Article 5).
 */
@Injectable()
export class TasteSignalService {
  constructor(private readonly prisma: PrismaService) {}

  async gather(userId: string): Promise<TasteSignals> {
    const [wishlist, follows, purchases, recentViews] = await Promise.all([
      this.prisma.wishlistItem.findMany({
        where: { userId },
        select: { game: { select: { id: true, title: true } } },
        take: 50,
      }),
      this.prisma.follow.findMany({
        where: { userId, targetType: 'GAME' },
        select: { game: { select: { id: true, title: true } } },
        take: 50,
      }),
      this.prisma.purchasedLicense.findMany({
        where: { userId, active: true },
        select: { listing: { select: { gameId: true, game: { select: { title: true } } } } },
        take: 50,
      }),
      this.prisma.analyticsEvent.findMany({
        where: {
          userId,
          eventType: 'GAME_PAGE_VIEW',
          gameId: { not: null },
          timestamp: { gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
        },
        select: { gameId: true },
        distinct: ['gameId'],
        take: VIEW_CAP,
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    const signalGames: TasteSignalGame[] = [];
    const tagAffinity = new Map<string, number>();
    const followedStudioIds: string[] = [];

    const pushGame = (gameId: string, title: string, source: TasteSignalGame['source']) => {
      signalGames.push({ gameId, title, signal: SIGNAL_WEIGHTS[source], source });
    };

    for (const w of wishlist) {
      if (w.game) pushGame(w.game.id, w.game.title, 'wishlist');
    }
    for (const p of purchases) {
      if (p.listing.gameId && p.listing.game) {
        pushGame(p.listing.gameId, p.listing.game.title, 'purchase');
      }
    }
    for (const f of follows) {
      if (f.game) pushGame(f.game.id, f.game.title, 'follow');
    }
    for (const v of recentViews) {
      if (v.gameId) signalGames.push({ gameId: v.gameId, title: '', signal: SIGNAL_WEIGHTS.view, source: 'view' });
    }

    const unique = new Map<string, TasteSignalGame>();
    for (const g of signalGames) {
      const existing = unique.get(g.gameId);
      if (!existing || g.signal > existing.signal) {
        unique.set(g.gameId, g);
      }
    }

    const capped = [...unique.values()].sort((a, b) => b.signal - a.signal).slice(0, SIGNAL_GAME_CAP);

    const [studioFollows, gameTags] = await Promise.all([
      this.prisma.follow.findMany({
        where: { userId, targetType: 'STUDIO' },
        select: { studioId: true },
      }),
      capped.length > 0
        ? this.prisma.gameTag.findMany({
            where: { gameId: { in: capped.map((g) => g.gameId) } },
            select: { gameId: true, tag: { select: { id: true } } },
          })
        : [],
    ]);

    for (const f of studioFollows) {
      if (f.studioId) followedStudioIds.push(f.studioId);
    }

    const gameWeight = new Map(capped.map((g) => [g.gameId, g.signal]));
    for (const gt of gameTags) {
      const weight = gameWeight.get(gt.gameId) ?? 0;
      if (weight > 0) {
        const current = tagAffinity.get(gt.tag.id) ?? 0;
        tagAffinity.set(gt.tag.id, current + weight);
      }
    }

    // Decay: keep only tags with meaningful affinity (top signals dominate).
    const ranked = [...tagAffinity.entries()].sort((a, b) => b[1] - a[1]);
    const decayed = new Map<string, number>();
    ranked.forEach(([tagId], i) => {
      if (i >= 20) return;
      decayed.set(tagId, Math.round((ranked[i][1] * Math.pow(TAG_AFFINITY_DECAY, i)) * 100) / 100);
    });

    return {
      signalGames: capped,
      tagAffinity: decayed,
      followedStudioIds,
      signalTexts: capped.filter((g) => g.title).map((g) => g.title),
    };
  }

  hasSignals(signals: TasteSignals): boolean {
    return signals.signalGames.length > 0 || signals.followedStudioIds.length > 0;
  }
}
