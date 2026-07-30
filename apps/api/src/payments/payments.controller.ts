import { Controller, Post, Body, Req, UseGuards, NotFoundException, Logger } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private payments: PaymentsService,
    private prisma: PrismaService,
  ) {}

  @Post('stripe/onboarding')
  @UseGuards(SessionAuthGuard)
  async getOnboardingLink(@Body() body: any, @Req() req: any) {
    const { studioId, refreshUrl, returnUrl } = body;
    if (!studioId) throw new Error('Missing studioId');

    const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.email) throw new NotFoundException('User email not found');

    const account = await this.payments.getOrCreateConnectAccount(studioId, user.email);
    const link = await this.payments.getOnboardingLink(
      account.stripeAccountId,
      refreshUrl,
      returnUrl,
    );
    this.logger.log(`Stripe onboarding link created for studio ${studioId}`);
    return { url: link.url };
  }
}
