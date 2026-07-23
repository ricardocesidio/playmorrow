import { Controller, Get, Post, Delete, Body, Param, UseGuards, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { OptionalSessionGuard } from '../auth/guards/optional-session.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CommentsService } from './comments.service';

@ApiTags('game-comments')
@Controller()
export class GameCommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('games/:slug/comments')
  @UseGuards(OptionalSessionGuard)
  @ApiOperation({ summary: 'List comments for a game' })
  async findByGame(@Param('slug') slug: string, @Query('page') page = 1, @Query('pageSize') pageSize = 20, @CurrentUser() user?: { id: string }) {
    return this.commentsService.findByGame(slug, +page, +pageSize, user?.id);
  }

  @Post('games/:slug/comments')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a comment on a game' })
  async create(@Param('slug') slug: string, @Body('body') body: string, @CurrentUser() user: { id: string }) {
    return this.commentsService.createForGame(slug, user.id, body);
  }

  @Post('game-comments/:commentId/reactions')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'React to a game comment' })
  async react(@Param('commentId') commentId: string, @Body('type') type: string, @CurrentUser() user: { id: string }) {
    return this.commentsService.reactToGameComment(commentId, user.id, type);
  }

  @Delete('game-comments/:commentId/reactions')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove reaction from a game comment' })
  async removeReaction(@Param('commentId') commentId: string, @Body('type') type: string, @CurrentUser() user: { id: string }) {
    return this.commentsService.removeGameCommentReaction(commentId, user.id, type);
  }
}
