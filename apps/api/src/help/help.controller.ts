import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { HelpService } from './help.service';
import { QueryArticlesDto } from './dto/query-articles.dto';
import { FeedbackDto } from './dto/feedback.dto';

@ApiTags('help')
@Controller('help')
export class HelpController {
  constructor(private readonly helpService: HelpService) {}

  @Get('articles')
  @ApiOkResponse({ description: 'Paginated list of published help articles.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'tag', required: false })
  async listArticles(@Query() query: QueryArticlesDto) {
    return this.helpService.listArticles(query, false);
  }

  @Get('articles/search')
  @ApiOkResponse({ description: 'Search help articles.' })
  @ApiQuery({ name: 'q', required: true })
  async searchArticles(@Query('q') q: string) {
    return this.helpService.searchArticles(q);
  }

  @Get('articles/:slug')
  @ApiOkResponse({ description: 'Single help article by slug.' })
  async getArticle(@Param('slug') slug: string) {
    return this.helpService.getArticle(slug);
  }

  @Get('categories')
  @ApiOkResponse({ description: 'List of active help categories.' })
  async listCategories() {
    return this.helpService.listCategories();
  }

  @Post('articles/:id/feedback')
  @UseGuards(SessionAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOkResponse({ description: 'Feedback submitted.' })
  async submitFeedback(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: FeedbackDto,
  ) {
    return this.helpService.submitFeedback(id, user.id, dto);
  }
}
