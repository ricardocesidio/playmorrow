import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { OptionalSessionGuard } from '../auth/guards/optional-session.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiTags('comments')
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('devlogs/:devlogId/comments')
  @Throttle({ default: { ttl: 60_000, limit: 20 } }) // anti-spam (#3)
  @UseGuards(SessionAuthGuard)
  @ApiCreatedResponse({ description: 'Comment created.' })
  async create(
    @CurrentUser() user: { id: string },
    @Param('devlogId') devlogId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(user.id, devlogId, dto);
  }

  @Get('devlogs/:devlogId/comments')
  @UseGuards(OptionalSessionGuard)
  @ApiOkResponse({ description: 'List of comments for a devlog.' })
  async findByDevlogId(
    @Param('devlogId') devlogId: string,
    @CurrentUser() user?: { id: string },
  ) {
    return this.commentsService.findByDevlogId(devlogId, user?.id);
  }

  @Patch('comments/:id')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Comment updated.' })
  async update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(user.id, id, dto);
  }

  @Delete('comments/:id')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Comment soft-deleted.' })
  async delete(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.commentsService.delete(user.id, id);
  }
}
