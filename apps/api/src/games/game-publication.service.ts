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
