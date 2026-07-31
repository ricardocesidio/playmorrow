import { Controller, Post, Body, UseGuards, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
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
  async getOnboardingLink(
    @CurrentUser() user: { id: string },
    @Body() body: { studioId: string; refreshUrl: string; returnUrl: string },
  ) {
    const { studioId, refreshUrl, returnUrl } = body;
    if (!studioId) throw new Error('Missing studioId');

    const member = await this.prisma.studioMember.findFirst({
      where: { studioId, userId: user.id, role: { in: ['OWNER', 'ADMIN'] } },
    });
    if (!member) throw new ForbiddenException('Only studio admins can connect Stripe');

    const dbUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.email) throw new NotFoundException('User email not found');

    const account = await this.payments.getOrCreateConnectAccount(studioId, dbUser.email);
    const link = await this.payments.getOnboardingLink(
      account.stripeAccountId,
      refreshUrl,
      returnUrl,
    );
    this.logger.log(`Stripe onboarding link created for studio ${studioId}`);
    return { url: link.url };
  }
}
