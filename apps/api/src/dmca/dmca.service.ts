import { Injectable, NotFoundException } from '@nestjs/common';
import type { ReportTargetType } from '@playmorrow/database';
import { PrismaService } from '../prisma/prisma.service';
import { EventBus } from '../common/event-bus';
import { logger } from '../common/logger';

@Injectable()
export class DmcaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  private async getDmcaUserId(): Promise<string> {
    const DMCA_EMAIL = 'dmca@playmorrow.co';
    let user = await this.prisma.user.findUnique({ where: { email: DMCA_EMAIL } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { email: DMCA_EMAIL, username: `dmca_${Date.now()}`, displayName: 'DMCA System', passwordHash: '', role: 'MODERATOR' },
      });
    }
    return user.id;
  }

  async fileTakedown(data: {
    reporterName: string; reporterEmail: string; targetType: string; targetId: string;
    description: string; infringedWork: string; consent: boolean;
  }) {
    if (!data.consent) throw new Error('You must consent to the DMCA notice terms');
    const dmcaUserId = await this.getDmcaUserId();

    const notice = await this.prisma.moderationReport.create({
      data: {
        reporterId: dmcaUserId,
        targetType: data.targetType as ReportTargetType,
        targetId: data.targetId,
        reason: 'COPYRIGHT',
        details: JSON.stringify({
          type: 'dmca_takedown',
          reporterName: data.reporterName,
          reporterEmail: data.reporterEmail,
          description: data.description,
          infringedWork: data.infringedWork,
          submittedAt: new Date().toISOString(),
        }),
        status: 'OPEN',
      },
    });

    // Auto-send counter-notification timer: content stays hidden for 14 days
    // After 14d without counter, content can be restored
    const counterDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    this.eventBus.emit({
      type: 'dmca_filed',
      targetType: data.targetType,
      targetId: data.targetId,
      metadata: { reportId: notice.id, counterDeadline: counterDeadline.toISOString() },
    });

    logger.info({ reportId: notice.id, targetType: data.targetType, targetId: data.targetId }, 'DMCA takedown filed');

    return { id: notice.id, status: 'open', counterDeadline: counterDeadline.toISOString() };
  }

  async fileCounter(noticeId: string, data: { respondentName: string; respondentEmail: string; consent: boolean }) {
    if (!data.consent) throw new Error('You must consent to the DMCA counter-notice terms');

    const notice = await this.prisma.moderationReport.findUnique({ where: { id: noticeId } });
    if (!notice) throw new NotFoundException('DMCA notice not found');
    if (notice.status !== 'OPEN') throw new Error('This DMCA notice has already been resolved');

    // Update the notice with counter-notification details
    const details = JSON.parse(notice.details || '{}');
    details.counterNotification = {
      respondentName: data.respondentName,
      respondentEmail: data.respondentEmail,
      filedAt: new Date().toISOString(),
    };

    await this.prisma.moderationReport.update({
      where: { id: noticeId },
      data: { details: JSON.stringify(details), status: 'RESOLVED' },
    });

    this.eventBus.emit({
      type: 'dmca_counter_filed',
      targetType: 'REPORT',
      targetId: noticeId,
      metadata: { respondentName: data.respondentName },
    });

    logger.info({ noticeId }, 'DMCA counter-notification filed');

    return { id: noticeId, status: 'counter_filed' };
  }

  async listNotices(page = 1, pageSize = 50) {
    const where = { reason: 'COPYRIGHT' as const };
    const [items, total] = await Promise.all([
      this.prisma.moderationReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize, take: pageSize,
      }),
      this.prisma.moderationReport.count({ where }),
    ]);
    return { items: items.map(r => ({ ...r, details: this.safeParse(r.details) })), total, page, pageSize, hasMore: page * pageSize < total };
  }

  private safeParse(json: string | null): unknown {
    try { return json ? JSON.parse(json) : null; } catch { return json; }
  }
}
