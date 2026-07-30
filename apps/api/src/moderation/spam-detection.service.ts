import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const SPAM_KEYWORDS = [
  'buy followers', 'cheap followers', 'free followers',
  'click here', 'act now', 'limited time',
  'make money fast', 'earn money', 'work from home',
  'casino', 'gambling', 'bet now',
  'viagra', 'pharmacy', 'prescription',
];

const SPAM_LINK_PATTERN = /https?:\/\/(?:[^\s]*\.)?(?:bit\.ly|tinyurl|shorturl|shortlink|shorte\.st|t\.co)\/[^\s]+/i;
const REPETITIVE_PATTERN = /(.)\1{10,}/; // Same character repeated 10+ times
const ALL_CAPS_RATIO = 0.7; // If 70%+ of letters are uppercase

@Injectable()
export class SpamDetectionService {
  constructor(private readonly prisma: PrismaService) {}

  async checkContent(text: string, userId: string): Promise<{ isSpam: boolean; reasons: string[] }> {
    const reasons: string[] = [];
    const lower = text.toLowerCase();

    // Keyword check
    for (const kw of SPAM_KEYWORDS) {
      if (lower.includes(kw)) {
        reasons.push(`Contains spam keyword: "${kw}"`);
        break;
      }
    }

    // Short link check
    if (SPAM_LINK_PATTERN.test(text)) {
      reasons.push('Contains shortened URL');
    }

    // Repetitive characters
    if (REPETITIVE_PATTERN.test(text)) {
      reasons.push('Contains repetitive characters');
    }

    // All-caps check (only for text that has letters)
    const letters = text.replace(/[^a-zA-Z]/g, '');
    if (letters.length > 10) {
      const upper = letters.replace(/[^A-Z]/g, '').length;
      if (upper / letters.length > ALL_CAPS_RATIO) {
        reasons.push('Excessive use of CAPS');
      }
    }

    // Rate-limit: check recent content from this user
    const recentCount = await this.prisma.comment.count({
      where: { authorId: userId, createdAt: { gte: new Date(Date.now() - 60_000) } },
    });
    if (recentCount >= 5) {
      reasons.push('More than 5 comments in 1 minute');
    }

    return { isSpam: reasons.length > 0, reasons };
  }
}
