import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { logger } from '../common/logger';

@Injectable()
export class EmailService {
  private readonly resend: Resend | null = null;
  private readonly from: string;
  private readonly isProduction: boolean;

  constructor(private configService: ConfigService) {
    this.from = this.configService.get<string>('EMAIL_FROM', 'PlayMorrow <noreply@playmorrow.com>');
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else if (this.isProduction) {
      logger.error('RESEND_API_KEY is missing in production! Email sending will fail.');
    } else {
      logger.warn('RESEND_API_KEY not set — verification codes will be logged to console in dev mode.');
    }
  }

  private htmlWrapper(content: string): string {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#020609;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:480px;margin:0 auto;padding:32px 24px">
<div style="text-align:center;margin-bottom:24px"><span style="color:#3EE7FF;font-size:20px;font-weight:700">◆ PLAYMOLLOW</span></div>
<div style="background:#0A1628;border:1px solid rgba(255,255,255,0.08);border-radius:4px;padding:24px;color:#E2E8F0;font-size:14px;line-height:1.6">
${content}
</div>
<div style="text-align:center;margin-top:24px;font-size:12px;color:#64748B">— The PlayMorrow Team</div>
</div></body></html>`;
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    if (this.resend) {
      await this.resend.emails.send({
        from: this.from,
        to: email,
        subject: 'Your PlayMorrow verification code',
        text: `Welcome to PlayMorrow.\n\nYour verification code is:\n\n${code}\n\nThis code expires in 15 minutes.\n\nIf you did not create a PlayMorrow account, you can ignore this email.`,
        html: this.htmlWrapper(`<p style="margin:0 0 16px">Welcome to PlayMorrow.</p><div style="background:#020609;border:1px solid #3EE7FF33;border-radius:4px;padding:16px;text-align:center;font-size:28px;letter-spacing:8px;color:#3EE7FF;font-weight:700;margin:16px 0">${code}</div><p style="margin:16px 0 0;font-size:13px;color:#94A3B8">This code expires in 15 minutes. If you did not create a PlayMorrow account, you can ignore this email.</p>`),
      });
    } else if (!this.isProduction) {
      logger.debug(`[DEV] Verification code for ${email}: ${code}`);
    } else {
      // Do not throw in production — registration must succeed.
      // The code is stored in DB so resendVerification can be used once RESEND_API_KEY is fixed.
      logger.error(
        `RESEND_API_KEY missing in production. Verification code for ${email} was NOT emailed. Code: ${code} (stored in DB for resend).`
      );
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.get<string>('WEB_ORIGIN', 'http://localhost:3000')}/reset-password?token=${token}`;
    const subject = 'Reset your PlayMorrow password';
    const text = [
      `Hello,`,
      ``,
      `You requested a password reset for your PlayMorrow account.`,
      ``,
      `Click the link below to reset your password:`,
      `${resetUrl}`,
      ``,
      `This link expires in 1 hour.`,
      `If you did not request this reset, you can safely ignore this email.`,
      ``,
      `— The PlayMorrow Team`,
    ].join('\n');

    if (this.resend) {
      await this.resend.emails.send({
        from: this.from,
        to: email,
        subject,
        text,
        html: this.htmlWrapper(`<p style="margin:0 0 16px">You requested a password reset for your PlayMorrow account.</p><a href="${resetUrl}" style="display:inline-block;background:#3EE7FF;color:#020609;text-decoration:none;padding:12px 24px;border-radius:4px;font-weight:600;margin:8px 0">Reset password</a><p style="margin:16px 0 0;font-size:13px;color:#94A3B8">This link expires in 1 hour. If you did not request this reset, you can safely ignore this email.</p>`),
      });
    } else if (!this.isProduction) {
      logger.debug(`[DEV] Password reset for ${email}: ${resetUrl}`);
    } else {
      logger.error(`RESEND_API_KEY missing in production. Password reset for ${email} was NOT sent. Link: ${resetUrl}`);
    }
  }

  async sendInvitationEmail(params: {
    email: string;
    studioName: string;
    inviterName: string;
    role: string;
    token: string;
  }): Promise<void> {
    const acceptUrl = `${this.configService.get<string>('WEB_ORIGIN', 'http://localhost:3000')}/invite/${params.token}`;
    const subject = `You've been invited to join ${params.studioName} on PlayMorrow`;
    const text = [
      `Hello,`,
      ``,
      `${params.inviterName} has invited you to join "${params.studioName}" on PlayMorrow as a ${params.role}.`,
      ``,
      `Click the link below to accept your invitation:`,
      `${acceptUrl}`,
      ``,
      `This invitation expires in 7 days.`,
      `If you don't have a PlayMorrow account yet, you'll be able to create one when you accept.`,
      ``,
      `— The PlayMorrow Team`,
    ].join('\n');

    if (this.resend) {
      await this.resend.emails.send({
        from: this.from,
        to: params.email,
        subject,
        text,
        html: this.htmlWrapper(`<p style="margin:0 0 16px">${params.inviterName} has invited you to join <strong>${params.studioName}</strong> on PlayMorrow as a <strong>${params.role}</strong>.</p><a href="${acceptUrl}" style="display:inline-block;background:#3EE7FF;color:#020609;text-decoration:none;padding:12px 24px;border-radius:4px;font-weight:600;margin:8px 0">Accept invitation</a><p style="margin:16px 0 0;font-size:13px;color:#94A3B8">This invitation expires in 7 days. If you don't have a PlayMorrow account yet, you'll be able to create one when you accept.</p>`),
      });
    } else if (!this.isProduction) {
      logger.debug(`[DEV] Invitation email for ${params.email}: To: ${params.email} Subject: ${subject} Link: ${acceptUrl}`);
    } else {
      logger.error(
        `RESEND_API_KEY missing in production. Invitation email to ${params.email} was NOT sent. Link: ${acceptUrl}`
      );
    }
  }
}
