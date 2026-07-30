import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { PartnerService } from './partner.service';

@Controller('partners')
export class PartnerController {
  constructor(private partner: PartnerService) {}

  @Get()
  async list(@Query('type') type?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.partner.list(type, parseInt(page || '1'), Math.min(parseInt(pageSize || '20'), 50));
  }

  @Get(':slug')
  async get(@Param('slug') slug: string) {
    return this.partner.getBySlug(slug);
  }

  @Post()
  async create(@Body() body: any) {
    return this.partner.create(body);
  }
}
