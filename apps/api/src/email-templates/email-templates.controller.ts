import {
  Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe,
  Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EmailTemplatesService } from './email-templates.service';
import { EmailSenderService } from '../email/email-sender.service';

@ApiTags('admin/email-templates')
@Controller('admin/email-templates')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('ADMIN')
export class EmailTemplatesController {
  constructor(
    private readonly svc: EmailTemplatesService,
    private readonly emailSender: EmailSenderService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all email templates' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(50), ParseIntPipe) pageSize: number,
  ) {
    return this.svc.findAll(page, pageSize);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get template by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.svc.findBySlug(slug);
  }

  @Post()
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Get('analytics/delivery')
  @ApiOperation({ summary: 'Get delivery analytics (open/click/bounce rates)' })
  async getDeliveryAnalytics() {
    return this.emailSender.getDeliveryAnalytics();
  }

  @ApiOperation({ summary: 'Create a new email template' })
  async create(@Body() body: { slug: string; name: string; subject: string; bodyHtml: string; variables: string[]; category?: string }) {
    return this.svc.create(body);
  }

  @Patch(':id')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Update an email template' })
  async update(@Param('id') id: string, @Body() body: { subject?: string; bodyHtml?: string; name?: string; variables?: string[] }) {
    return this.svc.update(id, body);
  }
}
