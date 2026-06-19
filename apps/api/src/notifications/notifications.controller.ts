import {
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { filter, map } from 'rxjs';

import { JwtService } from '@nestjs/jwt';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller()
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('me/notifications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Current user notifications.' })
  @ApiQuery({ name: 'status', required: false, enum: ['all', 'unread', 'read'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async findMyNotifications(
    @CurrentUser() user: { id: string },
    @Query('status', new DefaultValuePipe('all')) status: 'all' | 'unread' | 'read',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.notificationsService.findByRecipientId(user.id, page, Math.min(pageSize, 50), status);
  }

  @Get('me/notifications/unread-count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Unread notification count.' })
  async getUnreadCount(@CurrentUser() user: { id: string }) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Notification marked as read.' })
  async markAsRead(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    const result = await this.notificationsService.markAsRead(id, user.id);
    if (!result) {
      throw new NotFoundException('Notification not found');
    }
    return result;
  }

  @Patch('me/notifications/read-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'All notifications marked as read.' })
  async markAllAsRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Delete('notifications/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Notification dismissed (deleted).' })
  async remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    const result = await this.notificationsService.remove(id, user.id);
    if (!result) {
      throw new NotFoundException('Notification not found');
    }
    return result;
  }

  @Get('me/notifications/stream')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  @ApiOkResponse({ description: 'SSE stream for real-time notification updates (#21).' })
  async stream(@Query('token') token: string, @Res() res: Response, @Req() req: Request) {
    // Validate JWT via query param since EventSource can't set custom headers (#21).
    let userId: string;
    try {
      const payload = this.jwtService.verify(token) as { sub: string };
      userId = payload.sub;
    } catch {
      res.status(401).end();
      return;
    }
    res.flushHeaders();

    // Send initial count
    const { unreadCount } = await this.notificationsService.getUnreadCount(userId);
    res.write(`data: ${JSON.stringify({ unreadCount })}\n\n`);

    // Subscribe to events matching this user
    const subscription = this.notificationsService.events$
      .pipe(
        filter((e) => e.recipientId === userId),
        map((e) => `data: ${JSON.stringify({ unreadCount: e.unreadCount })}\n\n`),
      )
      .subscribe((msg) => {
        res.write(msg);
      });

    // Cleanup on disconnect
    req.on('close', () => {
      subscription.unsubscribe();
    });
  }
}
