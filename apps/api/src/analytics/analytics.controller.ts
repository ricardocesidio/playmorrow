import { Body, Controller, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { AnalyticsService } from './analytics.service';
import { TrackEventDto } from './dto/track-event.dto';
import { SkipCsrf } from '../common/skip-csrf.decorator';

@ApiTags('analytics')
@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('analytics/track')
  @SkipCsrf()
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async track(@Body() dto: TrackEventDto, @Req() req: Request) {
    await this.analyticsService.track({
      ...dto,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      referrer: req.headers['referer'],
    });
    return { success: true };
  }
}
