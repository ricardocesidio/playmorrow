import { Controller, Get, Req } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { HealthStatus } from '@playmorrow/types';

import { logger } from '../common/logger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
@SkipThrottle() // liveness probes must not be rate limited (#3)
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOkResponse({ description: 'Liveness + database connectivity probe.' })
  async check(@Req() req: any): Promise<HealthStatus> {
    let dbOk = true;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbOk = false;
    }

    // Email provider status (from audit)
    const emailConfigured = !!process.env.RESEND_API_KEY;

    const status = dbOk ? 'ok' : 'degraded';
    const log = req?.log || logger;
    log.info({ msg: 'health check', status, database: dbOk, emailProvider: emailConfigured });

    return {
      status,
      service: 'playmorrow-api',
      version: '0.1.0',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: {
        database: dbOk,
        emailProvider: emailConfigured,
      },
    };
  }
}
