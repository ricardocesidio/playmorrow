import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EventBus } from '../common/event-bus';
import { logger } from '../common/logger';
import * as Sentry from '@sentry/node';

@Injectable()
export class EscalationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  @Cron('0 */2 * * *') // Every 2 hours
  async escalateStaleReports() {
    await Sentry.withMonitor('playmorrow-report-escalation', async () => {
    const threshold = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

    const staleReports = await this.prisma.moderationReport.findMany({
      where: {
        status: 'OPEN',
        escalatedAt: null,
        createdAt: { lt: threshold },
      },
    });

    for (const report of staleReports) {
      await this.prisma.moderationReport.update({
        where: { id: report.id },
        data: { escalatedAt: new Date() },
      });

      this.eventBus.emit({
        type: 'report_escalated',
        targetType: 'REPORT',
        targetId: report.id,
        metadata: {
          reason: report.reason,
          targetType: report.targetType,
          createdAt: report.createdAt.toISOString(),
        },
      });

      logger.info({ reportId: report.id, reason: report.reason }, 'Report escalated — unresolved for 48h+');
    }

    if (staleReports.length > 0) {
      logger.info(`Escalated ${staleReports.length} stale reports`);
    }
    });
  }
}
