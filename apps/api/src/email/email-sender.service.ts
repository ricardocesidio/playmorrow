import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';
import { EmailTemplatesService } from '../email-templates/email-templates.service';
import { logger } from '../common/logger';
import * as crypto from 'node:crypto';

@Injectable()
export class EmailSenderService {
  private readonly resend: Resend | null = null;
  private readonly from: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private templates: EmailTemplatesService,
  ) {
    this.from = this.configService.get<string>('EMAIL_FROM', 'PlayMorrow <playmorrow@hotmail.com>');
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  async isBounced(email: string): Promise<boolean> {
    const count = await this.prisma.emailLog.count({ where: { email, status: 'bounced' } });
    return count > 0;
  }

  async markBounced(email: string): Promise<void> {
    await this.prisma.emailLog.updateMany({
      where: { email },
      data: { status: 'bounced' },
    }).catch(() => {});
    // Create a bounced log entry if none exists
    const existing = await this.prisma.emailLog.findFirst({ where: { email, status: 'bounced' } });
    if (!existing) {
      await this.prisma.emailLog.create({ data: { email, status: 'bounced' } }).catch(() => {});
    }
    logger.info({ email }, 'Email marked as bounced');
  }

  async sendTemplate(
    email: string,
    templateSlug: string,
    variables: Record<string, string>,
    userId?: string,
  ): Promise<boolean> {
    if (await this.isBounced(email)) {
      logger.warn({ email, templateSlug }, 'Skipping email to bounced address');
      return false;
    }
    try {
      const rendered = await this.templates.render(templateSlug, variables);
      const template = await this.templates.findBySlug(templateSlug);

      if (this.resend) {
        await this.resend.emails.send({
          from: this.from,
          to: email,
          subject: rendered.subject,
          html: this.wrapHtml(rendered.html),
        });
      } else {
        logger.debug(`[DEV EMAIL] To: ${email} | Subject: ${rendered.subject}`);
      }

      await this.log(email, template.id, 'sent', userId);
      return true;
    } catch (err: any) {
      logger.error(`Failed to send email to ${email} template ${templateSlug}: ${err.message}`);
      await this.log(email, undefined, 'failed', userId, err.message);
      return false;
    }
  }

  async sendRaw(
    email: string,
    subject: string,
    html: string,
    userId?: string,
  ): Promise<boolean> {
    try {
      if (this.resend) {
        await this.resend.emails.send({
          from: this.from,
          to: email,
          subject,
          html: this.wrapHtml(html),
        });
      } else {
        logger.debug(`[DEV EMAIL] To: ${email} | Subject: ${subject}`);
      }
      await this.log(email, undefined, 'sent', userId);
      return true;
    } catch (err: any) {
      logger.error(`Failed to send email to ${email}: ${err.message}`);
      await this.log(email, undefined, 'failed', userId, err.message);
      return false;
    }
  }

  private async log(email: string, templateId?: string, status = 'sent', userId?: string, error?: string) {
    await this.prisma.emailLog.create({
      data: { email, templateId, status, userId, error },
    }).catch(e => logger.error(`Failed to log email: ${e.message}`));
  }

  private wrapHtml(content: string): string {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#020609;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:480px;margin:0 auto;padding:32px 24px">
<div style="text-align:center;margin-bottom:24px"><span style="color:#3EE7FF;font-size:20px;font-weight:700">◆ PLAYMOLLOW</span></div>
<div style="background:#0A1628;border:1px solid rgba(255,255,255,0.08);border-radius:4px;padding:24px;color:#E2E8F0;font-size:14px;line-height:1.6">
${content}
</div>
<div style="text-align:center;margin-top:24px;font-size:12px;color:#64748B">— The PlayMorrow Team</div>
</div></body></html>`;
  }

  async getLogs(page = 1, pageSize = 50) {
    const [items, total] = await Promise.all([
      this.prisma.emailLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize, take: pageSize,
      }),
      this.prisma.emailLog.count(),
    ]);
    return { items, total, page, pageSize, hasMore: page * pageSize < total };
  }

  async getDeliveryAnalytics() {
    const [total, sent, bounced, opened, clicked, byTemplate] = await Promise.all([
      this.prisma.emailLog.count(),
      this.prisma.emailLog.count({ where: { status: 'sent' } }),
      this.prisma.emailLog.count({ where: { status: 'bounced' } }),
      this.prisma.emailLog.count({ where: { openedAt: { not: null } } }),
      this.prisma.emailLog.count({ where: { clickedAt: { not: null } } }),
      this.prisma.emailLog.groupBy({
        by: ['templateId'],
        _count: { id: true },
        where: { templateId: { not: null } },
      }),
    ]);

    return {
      total,
      sent,
      bounced,
      opened,
      clicked,
      openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
      clickRate: opened > 0 ? Math.round((clicked / opened) * 100) : 0,
      bounceRate: sent > 0 ? Math.round((bounced / sent) * 100) : 0,
      byTemplate,
    };
  }
}
