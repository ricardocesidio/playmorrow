import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailSenderService } from '../email/email-sender.service';
import { logger } from '../common/logger';

@Injectable()
export class DigestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailSender: EmailSenderService,
  ) {}

  @Cron('0 12 * * 1')
  async sendWeeklyDigests() {
    logger.info('[Digest] Starting weekly digest job');
    const prefs = await this.prisma.emailPreference.findMany({
      where: { digestFrequency: 'weekly', marketingOptIn: true },
      include: { user: { select: { id: true, email: true, displayName: true } } },
    });
    logger.info(`[Digest] Found ${prefs.length} users for weekly digest`);
    for (const pref of prefs) {
      await this.sendDigestForUser(pref.user.id, pref.user.email, pref.user.displayName, 'weekly');
    }
  }

  async sendDigestForUser(userId: string, email: string, displayName: string, frequency: 'daily' | 'weekly') {
    const since = new Date();
    since.setDate(since.getDate() - (frequency === 'weekly' ? 7 : 1));
    const origin = process.env.WEB_ORIGIN || 'https://playmorrow.vercel.app';

    const [following, wishlist] = await Promise.all([
      this.prisma.follow.findMany({ where: { userId, targetType: 'STUDIO' }, select: { studioId: true } }),
      this.prisma.wishlistItem.findMany({ where: { userId }, select: { gameId: true } }),
    ]);

    const followedStudioIds = following.map(f => f.studioId).filter((id): id is string => id !== null);
    const wishlistedGameIds = wishlist.map(w => w.gameId);

    const [followedDevlogs, wishlistDevlogs] = await Promise.all([
      followedStudioIds.length > 0
        ? this.prisma.devlog.findMany({
            where: { publishedAt: { gte: since }, game: { studioId: { in: followedStudioIds }, isPublished: true } },
            select: { id: true, title: true, game: { select: { title: true, slug: true } } },
            orderBy: { publishedAt: 'desc' },
            take: 10,
          })
        : Promise.resolve([] as { id: string; title: string; game: { title: string; slug: string } }[]),
      wishlistedGameIds.length > 0
        ? this.prisma.devlog.findMany({
            where: { publishedAt: { gte: since }, gameId: { in: wishlistedGameIds } },
            select: { id: true, title: true, game: { select: { title: true, slug: true } } },
            orderBy: { publishedAt: 'desc' },
            take: 10,
          })
        : Promise.resolve([] as { id: string; title: string; game: { title: string; slug: string } }[]),
    ]);

    const activityCount = followedDevlogs.length + wishlistDevlogs.length;
    if (activityCount === 0) return;

    const items: { id: string; title: string; game: { title: string; slug: string } }[] = [...followedDevlogs, ...wishlistDevlogs].slice(0, 10);
    const digestHtml = `
      <p>Hi ${displayName}, here's your ${frequency} digest from Playmorrow.</p>
      <p>${activityCount} new updates since your last digest.</p>
      ${items.map(d => `<p style="margin:8px 0"><a href="${origin}/devlogs/${d.id}" style="color:#3ee7ff">${d.title}</a><br/><span style="color:#8c969b;font-size:12px">${d.game.title}</span></p>`).join('')}
      <p style="margin-top:20px"><a href="${origin}/feed" style="color:#3ee7ff">View full feed →</a></p>
    `;

    await this.emailSender.sendRaw(email, `Your Playmorrow ${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Digest`, digestHtml, userId);
  }
}
