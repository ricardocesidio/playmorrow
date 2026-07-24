import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { HelpService } from './help.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticlesDto } from './dto/query-articles.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('admin/help')
@Controller('admin/help')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminHelpController {
  constructor(private readonly helpService: HelpService) {}

  @Get('articles')
  @ApiOkResponse({ description: 'Paginated list of all articles (including drafts).' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'tag', required: false })
  async listAllArticles(@Query() query: QueryArticlesDto) {
    return this.helpService.listArticles(query, true);
  }

  @Post('articles')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOkResponse({ description: 'Article created.' })
  async createArticle(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateArticleDto,
  ) {
    return this.helpService.createArticle(user.id, dto);
  }

  @Patch('articles/:id')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOkResponse({ description: 'Article updated.' })
  async updateArticle(
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
  ) {
    return this.helpService.updateArticle(id, dto);
  }

  @Delete('articles/:id')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOkResponse({ description: 'Article deleted.' })
  async deleteArticle(@Param('id') id: string) {
    return this.helpService.deleteArticle(id);
  }

  @Patch('articles/:id/publish')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOkResponse({ description: 'Article publish status toggled.' })
  async togglePublish(@Param('id') id: string) {
    return this.helpService.togglePublish(id);
  }

  @Post('categories')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOkResponse({ description: 'Category created.' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.helpService.createCategory(dto);
  }

  @Patch('categories/:id')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOkResponse({ description: 'Category updated.' })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.helpService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOkResponse({ description: 'Category deactivated.' })
  async deleteCategory(@Param('id') id: string) {
    return this.helpService.deleteCategory(id);
  }
}
