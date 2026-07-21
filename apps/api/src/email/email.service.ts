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

  async sendVerificationCode(email: string, code: string): Promise<void> {
    if (this.resend) {
      await this.resend.emails.send({
        from: this.from,
        to: email,
        subject: 'Your PlayMorrow verification code',
        text: `Welcome to PlayMorrow.\n\nYour verification code is:\n\n${code}\n\nThis code expires in 15 minutes.\n\nIf you did not create a PlayMorrow account, you can ignore this email.`,
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
