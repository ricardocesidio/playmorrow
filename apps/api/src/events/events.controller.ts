import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';

@Controller('events')
export class EventsController {
  constructor(private events: EventsService) {}

  @Get()
  async list(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('upcoming') upcoming?: string) {
    return this.events.list(Math.max(1, parseInt(page || '1')), Math.min(parseInt(pageSize || '20'), 50), upcoming === '1');
  }

  @Get(':slug')
  async get(@Param('slug') slug: string) {
    return this.events.getBySlug(slug);
  }

  @Post()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  async create(@Body() body: CreateEventDto, @CurrentUser() _user: { id: string }) {
    if (!body.title || !body.slug || !body.startDate) throw new BadRequestException('title, slug, and startDate are required');
    return this.events.create(body);
  }

  @Patch(':slug')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  async update(@Param('slug') slug: string, @Body() body: { status?: string }) {
    return this.events.publish(slug, body.status);
  }
}
