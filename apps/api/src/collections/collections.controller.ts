import { Controller, Get, NotFoundException, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Prisma } from '@playmorrow/database';
import { PrismaService } from '../prisma/prisma.service';
import { COLLECTIONS, getCollection } from './collections.config';

@ApiTags('collections')
@Controller('collections')
export class CollectionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listCollections() {
    return COLLECTIONS.map(c => ({ slug: c.slug, label: c.label, description: c.description }));
  }

  @Get(':slug')
  async getCollection(
    @Param('slug') slug: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize: number = 20,
  ) {
    const config = getCollection(slug);
    if (!config) throw new NotFoundException(`Collection "${slug}" not found`);

    const skip = (page - 1) * pageSize;
    const orderBy = config.sort?.includes('_desc')
      ? { [config.sort.replace('_desc', '')]: 'desc' as const }
      : config.sort?.includes('_asc')
        ? { [config.sort.replace('_asc', '')]: 'asc' as const }
        : { followersCount: 'desc' as const };

    const [items, total] = await Promise.all([
      this.prisma.game.findMany({
        where: config.filter as Prisma.GameWhereInput,
        orderBy: orderBy as Prisma.GameOrderByWithRelationInput,
        skip,
        take: pageSize,
        select: {
          id: true, title: true, slug: true, tagline: true,
          coverUrl: true, status: true, isFree: true, priceCents: true,
          followersCount: true, wishlistsCount: true,
          studio: { select: { name: true, slug: true } },
        },
      }),
      this.prisma.game.count({ where: config.filter as Prisma.GameWhereInput }),
    ]);

    return { items, total, page, pageSize, hasMore: skip + pageSize < total };
  }
}
