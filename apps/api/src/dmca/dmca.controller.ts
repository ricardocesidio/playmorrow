import { Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SkipCsrf } from '../common/skip-csrf.decorator';
import { DmcaService } from './dmca.service';

@ApiTags('dmca')
@Controller()
export class DmcaController {
  constructor(private readonly dmca: DmcaService) {}

  @Post('dmca/takedown')
  @SkipCsrf()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'File a DMCA takedown notice (public)' })
  async takedown(@Body() body: {
    reporterName: string; reporterEmail: string; targetType: string; targetId: string;
    description: string; infringedWork: string; consent: boolean;
  }) {
    return this.dmca.fileTakedown(body);
  }

  @Post('dmca/counter/:id')
  @SkipCsrf()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'File a DMCA counter-notification (public)' })
  async counter(@Param('id') id: string, @Body() body: {
    respondentName: string; respondentEmail: string; consent: boolean;
  }) {
    return this.dmca.fileCounter(id, body);
  }

  @Get('admin/dmca')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'List DMCA notices (admin)' })
  async list(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(50), ParseIntPipe) pageSize: number,
  ) {
    return this.dmca.listNotices(page, pageSize);
  }
}
