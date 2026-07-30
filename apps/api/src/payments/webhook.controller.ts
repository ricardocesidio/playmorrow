import { Controller, Post, Body, Headers, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';

@Controller('webhooks/stripe')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private stripe: any = null;

  constructor(
    private config: ConfigService,
    private payments: PaymentsService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (key) {
      const Stripe = require('stripe');
      this.stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' });
    }
  }

  @Post()
  async handleWebhook(
    @Body() body: any,
    @Headers('stripe-signature') signature: string,
  ) {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!this.stripe || !secret) {
      this.logger.warn('Webhook received but Stripe not configured — skipping');
      return { received: true };
    }

    let event: any;
    try {
      event = this.stripe.webhooks.constructEvent(
        JSON.stringify(body),
        signature,
        secret,
      );
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      return { error: 'Invalid signature' };
    }

    const alreadyProcessed = await this.payments.isWebhookProcessed(event.id);
    if (alreadyProcessed) {
      this.logger.log(`Webhook ${event.id} already processed — skipping (idempotency)`);
      return { received: true };
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const amountCents = pi.amount_received || pi.amount;
      const platformFee = pi.application_fee_amount || 0;
      const buyerId = pi.metadata?.buyerId;
      const listingId = pi.metadata?.listingId;
      const sellerId = pi.transfer_data?.destination
        ? await this.resolveSellerId(pi.transfer_data.destination)
        : undefined;

      if (buyerId && amountCents > 0) {
        await this.payments.processSuccessfulPayment(
          pi.id,
          buyerId,
          amountCents,
          platformFee,
          sellerId,
          listingId,
        );
        this.logger.log(`Payment ${pi.id}: ${amountCents}usd processed`);
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object;
      this.logger.warn(`Payment failed: ${pi.id} — ${pi.last_payment_error?.message}`);
    }

    await this.payments.markWebhookProcessed(event.id, event.type);
    return { received: true };
  }

  private async resolveSellerId(stripeAccountId: string): Promise<string | undefined> {
    const account = await this.payments['prisma'].stripeConnectAccount.findUnique({
      where: { stripeAccountId },
      include: { studio: { include: { members: { where: { role: 'OWNER' }, take: 1 } } } },
    });
    return account?.studio?.members?.[0]?.userId;
  }
}
