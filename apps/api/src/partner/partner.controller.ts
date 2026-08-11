import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PartnerService } from './partner.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';

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
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async create(@Body() body: CreatePartnerDto) {
    if (!body.type || !body.name || !body.slug) throw new BadRequestException('type, name, and slug are required');
    return this.partner.create(body);
  }

  @Patch(':slug')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async update(@Param('slug') slug: string, @Body() body: UpdatePartnerDto) {
    return this.partner.update(slug, body);
  }
}
