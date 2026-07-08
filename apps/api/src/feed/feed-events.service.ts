import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async emit(
    type: string,
    data: {
      studioId: string;
      gameId?: string;
      actorId?: string;
      payload: Record<string, unknown>;
    },
  ) {
    return this.prisma.feedEvent.create({
      data: {
        type,
        studioId: data.studioId,
        gameId: data.gameId ?? null,
        actorId: data.actorId ?? null,
        payload: data.payload,
      },
    });
  }

  /** Called when a devlog is published — creates feed event + auto community post */
  async onDevlogPublished(params: {
    devlog: {
      id: string;
      title: string;
      slug: string;
      gameId: string;
      studioId: string;
      authorId: string;
    };
    gameTitle: string;
  }) {
    const { devlog, gameTitle } = params;

    // 1. Emit feed event
    await this.emit('DEVLOG_PUBLISHED', {
      studioId: devlog.studioId,
      gameId: devlog.gameId,
      actorId: devlog.authorId,
      payload: {
        devlogId: devlog.id,
        devlogTitle: devlog.title,
        devlogSlug: devlog.slug,
        gameTitle,
      },
    });

    // 2. Auto-create Community Discussion comment
    try {
      await this.prisma.comment.create({
        data: {
          gameId: devlog.gameId,
          authorId: devlog.authorId,
          body: `📰 **${gameTitle} — ${devlog.title}**\n\nA new devlog was published. [Read more](/devlogs/${devlog.slug})`,
          parentId: null,
        },
      });
    } catch {
      // Don't fail the publish if community post creation fails
    }
  }
}
