import { Controller, Get, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SearchService, type SearchFilters } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOkResponse({ description: 'Global search results with filters.' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'genre', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'tag', required: false })
  @ApiQuery({ name: 'engine', required: false })
  @ApiQuery({ name: 'isFree', required: false })
  @ApiQuery({ name: 'sort', required: false, enum: ['relevance', 'popularity', 'newest', 'most_wishlisted'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async search(
    @Query('q') q: string,
    @Query('genre') genre: string | undefined,
    @Query('status') status: string | undefined,
    @Query('tag') tag: string | undefined,
    @Query('engine') engine: string | undefined,
    @Query('isFree') isFree: string | undefined,
    @Query('sort') sort: 'relevance' | 'popularity' | 'newest' | 'most_wishlisted' | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ) {
    if (!q?.trim()) return { games: { items: [], total: 0 }, studios: { items: [], total: 0 }, devlogs: { items: [], total: 0 }, query: '', page, pageSize };

    const filters: SearchFilters = {};
    if (genre) filters.genre = genre;
    if (status) filters.status = status;
    if (tag) filters.tag = tag;
    if (engine) filters.engine = engine;
    if (isFree !== undefined) filters.isFree = isFree === 'true';
    if (sort) filters.sort = sort;

    return this.searchService.search(q, filters, page, Math.min(pageSize, 50));
  }
}
