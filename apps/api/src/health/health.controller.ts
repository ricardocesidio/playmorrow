import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { HealthStatus } from '@playmorrow/types';

import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
@SkipThrottle() // liveness probes must not be rate limited (#3)
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOkResponse({ description: 'Liveness + database connectivity probe.' })
  async check(): Promise<HealthStatus> {
    let dbOk = true;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbOk = false;
    }

    // Email provider status (from audit)
    const emailConfigured = !!process.env.RESEND_API_KEY;

    return {
      status: dbOk ? 'ok' : 'degraded',
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
