import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { PartnerService } from './partner.service';

@Controller('partners')
export class PartnerController {
  constructor(private partner: PartnerService) {}

  @Get()
  async list(@Query('type') type?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.partner.list(type, Math.max(1, parseInt(page || '1')), Math.min(parseInt(pageSize || '20'), 50));
  }

  @Get(':slug')
  async get(@Param('slug') slug: string) {
    return this.partner.getBySlug(slug);
  }

  @Post()
  @UseGuards(SessionAuthGuard)
  async create(@Body() body: { type: string; name: string; slug: string; description?: string; websiteUrl?: string }) {
    if (!body.type || !body.name || !body.slug) throw new Error('type, name, and slug are required');
    return this.partner.create(body);
  }
}
