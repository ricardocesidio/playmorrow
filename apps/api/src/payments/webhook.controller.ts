import { Controller, Post, Req, Headers, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import Stripe from 'stripe';

@Controller('webhooks/stripe')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private stripe: Stripe | null = null;

  constructor(
    private config: ConfigService,
    private payments: PaymentsService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (key) {
      this.stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' });
    }
  }

  @Post()
  async handleWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!this.stripe || !secret) {
      this.logger.warn('Webhook received but Stripe not configured — skipping');
      return { received: true };
    }

    let event: any;
    try {
      const rawBody = req.rawBody;
      if (!rawBody) {
        this.logger.error('Stripe webhook: rawBody not available — ensure NestFactory.create(AppModule, { rawBody: true })');
        return { error: 'Webhook raw body unavailable' };
      }
      event = this.stripe.webhooks.constructEvent(
        rawBody instanceof Buffer ? rawBody : Buffer.from(rawBody),
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
      const buyerId = pi.metadata?.buyerId;
      const listingId = pi.metadata?.listingId;

      if (buyerId && listingId) {
        await this.payments.processSuccessfulPayment(
          pi.id, buyerId, pi.amount_received || pi.amount, pi.application_fee_amount || 0,
          undefined, listingId,
        );
        this.logger.log(`Payment ${pi.id} processed, license created`);
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object;
      this.logger.warn(`Payment failed: ${pi.id} — ${pi.last_payment_error?.message}`);
    }

    await this.payments.markWebhookProcessed(event.id, event.type);
    return { received: true };
  }
}
