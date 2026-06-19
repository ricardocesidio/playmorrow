import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { ReactDto } from './dto/react.dto';
import { ReactionsService } from './reactions.service';

@ApiTags('reactions')
@Controller()
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  // ── DEVOOG REACTIONS ─────────────────────────────────────────────────

  @Post('devlogs/:devlogId/reactions')
  @Throttle({ default: { ttl: 60_000, limit: 30 } }) // anti-spam (#3)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Reaction added to devlog.' })
  async reactToDevlog(
    @CurrentUser() user: { id: string },
    @Param('devlogId') devlogId: string,
    @Body() dto: ReactDto,
  ) {
    return this.reactionsService.reactToDevlog(user.id, devlogId, dto.type);
  }

  @Delete('devlogs/:devlogId/reactions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Reaction removed from devlog.' })
  async removeDevlogReaction(
    @CurrentUser() user: { id: string },
    @Param('devlogId') devlogId: string,
    @Query('type') type?: string,
  ) {
    return this.reactionsService.removeDevlogReaction(user.id, devlogId, type);
  }

  @Get('devlogs/:devlogId/reactions')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOkResponse({ description: 'Devlog reaction counts and viewer reactions.' })
  async getDevlogReactions(
    @Param('devlogId') devlogId: string,
    @CurrentUser() user?: { id: string },
  ) {
    return this.reactionsService.getDevlogReactions(devlogId, user?.id);
  }

  // ── COMMENT REACTIONS ────────────────────────────────────────────────

  @Post('comments/:commentId/reactions')
  @Throttle({ default: { ttl: 60_000, limit: 30 } }) // anti-spam (#3)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Reaction added to comment.' })
  async reactToComment(
    @CurrentUser() user: { id: string },
    @Param('commentId') commentId: string,
    @Body() dto: ReactDto,
  ) {
    return this.reactionsService.reactToComment(user.id, commentId, dto.type);
  }

  @Delete('comments/:commentId/reactions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Reaction removed from comment.' })
  async removeCommentReaction(
    @CurrentUser() user: { id: string },
    @Param('commentId') commentId: string,
    @Query('type') type?: string,
  ) {
    return this.reactionsService.removeCommentReaction(user.id, commentId, type);
  }

  @Get('comments/:commentId/reactions')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOkResponse({ description: 'Comment reaction counts and viewer reactions.' })
  async getCommentReactions(
    @Param('commentId') commentId: string,
    @CurrentUser() user?: { id: string },
  ) {
    return this.reactionsService.getCommentReactions(commentId, user?.id);
  }

  // Batch: all comment reactions for a devlog in one request (#9 / #24).
  @Get('devlogs/:devlogId/comments/reactions')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOkResponse({ description: 'Reaction counts + viewer reactions for every comment on a devlog, keyed by comment id.' })
  async getDevlogCommentReactions(
    @Param('devlogId') devlogId: string,
    @CurrentUser() user?: { id: string },
  ) {
    return this.reactionsService.getCommentReactionsForDevlog(devlogId, user?.id);
  }
}
