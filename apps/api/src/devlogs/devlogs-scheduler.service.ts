import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { FeedEngineService } from '../feed/feed-events.service';

@Injectable()
export class DevlogsSchedulerService {
  private readonly logger = new Logger(DevlogsSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly feedEngine: FeedEngineService,
  ) {}

  @Cron('*/5 * * * *')
  async publishScheduledDevlogs(): Promise<void> {
    const now = new Date();

    const scheduled = await this.prisma.devlog.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledFor: { lte: now },
        isPublished: false,
      },
      include: {
        game: { select: { id: true, title: true, slug: true, studioId: true } },
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    if (scheduled.length === 0) return;

    this.logger.log(`Found ${scheduled.length} devlogs to publish`);

    for (const devlog of scheduled) {
      try {
        await this.prisma.devlog.update({
          where: { id: devlog.id },
          data: {
            isPublished: true,
            status: 'PUBLISHED',
            publishedAt: now,
          },
        });

        await this.feedEngine.onDevlogPublished({
          devlog: {
            id: devlog.id,
            title: devlog.title,
            slug: devlog.slug,
            gameId: devlog.game.id,
            studioId: devlog.game.studioId,
            authorId: devlog.authorId,
          },
          gameTitle: devlog.game.title,
        });

        this.logger.log(`Published: ${devlog.title} (${devlog.slug})`);
      } catch (error) {
        this.logger.error(`Failed to publish devlog ${devlog.id} (${devlog.title}): ${error}`);
      }
    }
  }
}
