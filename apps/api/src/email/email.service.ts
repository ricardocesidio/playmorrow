import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
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
      this.logger.error('RESEND_API_KEY is missing in production! Email sending will fail.');
    } else {
      this.logger.warn('RESEND_API_KEY not set — verification codes will be logged to console in dev mode.');
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
      this.logger.log(`[DEV] Verification code for ${email}: ${code}`);
    } else {
      throw new Error('Email provider not configured. Set RESEND_API_KEY.');
    }
  }
}
