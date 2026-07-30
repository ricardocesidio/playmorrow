import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private events: EventsService) {}

  @Get()
  async list(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.events.list(Math.max(1, parseInt(page || '1')), Math.min(parseInt(pageSize || '20'), 50));
  }

  @Get(':slug')
  async get(@Param('slug') slug: string) {
    return this.events.getBySlug(slug);
  }

  @Post()
  async create(@Body() body: any) {
    return this.events.create(body);
  }
}
