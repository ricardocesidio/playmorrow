import { Injectable, NotFoundException } from '@nestjs/common';

import { assertStudioWriteAccess } from '../common/studio-permissions';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateRoadmapItemDto } from './dto/create-roadmap-item.dto';
import type { UpdateRoadmapItemDto } from './dto/update-roadmap-item.dto';

const ROADMAP_INCLUDE = {
  game: { select: { id: true, title: true, slug: true, studioId: true } },
} as const;

@Injectable()
export class RoadmapItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, gameSlug: string, dto: CreateRoadmapItemDto) {
    const game = await this.prisma.game.findUnique({
      where: { slug: gameSlug.toLowerCase() },
      include: { studio: { include: { members: true } } },
    });
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    assertStudioWriteAccess({ id: userId, role: user.role }, game.studio.members);

    const item = await this.prisma.roadmapItem.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status ?? 'PLANNED',
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        position: dto.position ?? 0,
        gameId: game.id,
      },
      include: ROADMAP_INCLUDE,
    });

    return this.toResponse(item, game.studio);
  }

  async findByGameSlug(gameSlug: string) {
    const game = await this.prisma.game.findUnique({
      where: { slug: gameSlug.toLowerCase() },
      include: { studio: { select: { id: true, name: true, slug: true } } },
    });
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const items = await this.prisma.roadmapItem.findMany({
      where: { gameId: game.id },
      orderBy: [{ position: 'asc' }, { targetDate: 'asc' }, { createdAt: 'asc' }],
      include: ROADMAP_INCLUDE,
    });

    return items.map((item) => this.toResponse(item, game.studio));
  }

  async findById(id: string) {
    const item = await this.prisma.roadmapItem.findUnique({
      where: { id },
      include: {
        ...ROADMAP_INCLUDE,
        game: { include: { studio: { select: { id: true, name: true, slug: true } } } },
      },
    });

    if (!item) {
      return null;
    }

    return this.toResponse(item, item.game.studio);
  }

  async update(userId: string, id: string, dto: UpdateRoadmapItemDto) {
    const item = await this.prisma.roadmapItem.findUnique({
      where: { id },
      include: { game: { include: { studio: { include: { members: true } } } } },
    });

    if (!item) {
      throw new NotFoundException('Roadmap item not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    assertStudioWriteAccess({ id: userId, role: user.role }, item.game.studio.members);

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.position !== undefined) data.position = dto.position;
    if (dto.targetDate !== undefined) data.targetDate = new Date(dto.targetDate);

    const updated = await this.prisma.roadmapItem.update({
      where: { id },
      data,
      include: ROADMAP_INCLUDE,
    });

    const studio = await this.prisma.studio.findUnique({
      where: { id: item.game.studioId },
      select: { id: true, name: true, slug: true },
    });

    return this.toResponse(updated, studio ?? { id: item.game.studioId, name: '', slug: '' });
  }

  async reorder(userId: string, gameSlug: string, items: { id: string; position: number }[]) {
    const game = await this.prisma.game.findUnique({
      where: { slug: gameSlug.toLowerCase() },
      include: { studio: { include: { members: true } } },
    });
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    assertStudioWriteAccess({ id: userId, role: user.role }, game.studio.members);

    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.roadmapItem.update({
          where: { id: item.id },
          data: { position: item.position },
        }),
      ),
    );

    return { reordered: items.length };
  }

  private toResponse(
    item: {
      id: string;
      title: string;
      description: string | null;
      status: string;
      targetDate: Date | null;
      position: number;
      createdAt: Date;
      updatedAt: Date;
      game: { id: string; title: string; slug: string };
    },
    studio: { id: string; name: string; slug: string },
  ) {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      status: item.status,
      targetDate: item.targetDate?.toISOString() ?? null,
      position: item.position,
      game: { id: item.game.id, title: item.game.title, slug: item.game.slug },
      studio: { id: studio.id, name: studio.name, slug: studio.slug },
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
