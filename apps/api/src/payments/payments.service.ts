import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe | null = null;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (key) {
      this.stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' });
    }
  }

  async createPaymentIntent(
    amountCents: number,
    applicationFeeCents: number,
    stripeAccountId: string,
    metadata: Record<string, string> = {},
  ) {
    if (!this.stripe) throw new Error('Stripe not configured — STRIPE_SECRET_KEY missing');
    return this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      application_fee_amount: applicationFeeCents,
      transfer_data: { destination: stripeAccountId },
      metadata,
    });
  }

  async getOrCreateConnectAccount(studioId: string, email: string) {
    if (!this.stripe) throw new Error('Stripe not configured');

    const existing = await this.prisma.stripeConnectAccount.findUnique({ where: { studioId } });
    if (existing?.onboarded) return existing;

    if (!existing) {
      const account = await this.stripe.accounts.create({
        type: 'express',
        email,
        business_type: 'individual',
        capabilities: { transfers: { requested: true } },
      });
      const record = await this.prisma.stripeConnectAccount.create({
        data: { studioId, stripeAccountId: account.id, accountType: 'express', onboarded: false },
      });
      return record;
    }

    return existing;
  }

  async getOnboardingLink(stripeAccountId: string, refreshUrl: string, returnUrl: string) {
    if (!this.stripe) throw new Error('Stripe not configured');
    return this.stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
  }

  async recordTransaction(data: {
    type: 'PURCHASE' | 'REFUND' | 'PAYOUT' | 'REFERRAL_COMMISSION' | 'PLEDGE';
    amountCents: number;
    platformFeeCents: number;
    buyerId?: string;
    sellerId?: string;
    listingId?: string;
    stripePaymentIntentId?: string;
    description?: string;
  }) {
    return this.prisma.transaction.create({ data: { ...data, status: 'PENDING' } });
  }

  async isWebhookProcessed(stripeEventId: string): Promise<boolean> {
    const existing = await this.prisma.processedWebhookEvent.findUnique({
      where: { stripeEventId },
    });
    return !!existing;
  }

  async markWebhookProcessed(stripeEventId: string, type: string) {
    await this.prisma.processedWebhookEvent.create({
      data: { stripeEventId, type },
    });
  }

  async processSuccessfulPayment(
    stripePaymentIntentId: string,
    buyerId: string,
    amountCents: number,
    platformFeeCents: number,
    sellerId?: string,
    listingId?: string,
  ) {
    const existing = await this.prisma.transaction.findUnique({
      where: { stripePaymentIntentId },
    });
    if (!existing) return null; // no pending transaction

    if (existing.status === 'COMPLETED') return existing; // already processed

    return this.prisma.$transaction(async (tx) => {
      const txn = await tx.transaction.update({
        where: { id: existing.id },
        data: { status: 'COMPLETED' },
      });

      if (listingId && buyerId) {
        await tx.purchasedLicense.upsert({
          where: { userId_listingId: { userId: buyerId, listingId } },
          create: { userId: buyerId, listingId, transactionId: txn.id },
          update: { active: true },
        });
      }

      return txn;
    });
  }
}
