import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipCsrf } from '../../common/skip-csrf.decorator';
import { EmailSenderService } from '../email-sender.service';
import { logger } from '../../common/logger';

@ApiTags('email/webhooks')
@Controller('email/webhooks')
@SkipCsrf()
export class EmailWebhooksController {
  constructor(private readonly sender: EmailSenderService) {}

  @Post('resend')
  @ApiOperation({ summary: 'Receive Resend webhook events (bounces, complaints)' })
  async resendWebhook(@Body() body: any) {
    const eventType = body?.type || body?.event;
    const email = body?.data?.email || body?.email;

    if (eventType === 'email.bounced' || eventType === 'email.complained' || eventType === 'bounce') {
      if (email) {
        await this.sender.markBounced(email);
        logger.info({ email, eventType }, 'Email webhook: bounced/complained');
      }
    }

    return { received: true };
  }
}
