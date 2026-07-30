import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post('stripe/onboarding')
  @UseGuards(SessionAuthGuard)
  async getOnboardingLink(@Body() body: any, @Req() req: any) {
    const { studioId, refreshUrl, returnUrl } = body;
    const userEmail = req.user?.email;
    if (!studioId || !userEmail) throw new Error('Missing studioId or user email');

    const account = await this.payments.getOrCreateConnectAccount(studioId, userEmail);
    const link = await this.payments.getOnboardingLink(
      account.stripeAccountId,
      refreshUrl,
      returnUrl,
    );
    return { url: link.url };
  }
}
