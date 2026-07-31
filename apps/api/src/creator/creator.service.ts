import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CreatorService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateCode(userId: string) {
    const existing = await this.prisma.referralCode.findFirst({ where: { userId } });
    if (existing) return existing;

    const code = this.generateCode();
    return this.prisma.referralCode.create({ data: { userId, code } });
  }

  async getMyReferrals(userId: string) {
    const code = await this.prisma.referralCode.findFirst({ where: { userId } });
    if (!code) return { code: null, commissions: [], totalEarned: 0 };

    const commissions = await this.prisma.transaction.findMany({
      where: { type: 'REFERRAL_COMMISSION', sellerId: userId },
      orderBy: { createdAt: 'desc' },
    });

    const totalEarned = commissions.reduce((s, t) => s + t.amountCents, 0);
    return { code: code.code, commissions, totalEarned };
  }

  async applyReferral(buyerId: string, referralCode: string, purchaseAmountCents: number) {
    const code = await this.prisma.referralCode.findUnique({ where: { code: referralCode } });
    if (!code || code.userId === buyerId) return;

    const alreadyCredited = await this.prisma.transaction.findFirst({
      where: { type: 'REFERRAL_COMMISSION', sellerId: code.userId, buyerId },
    });
    if (alreadyCredited) return;

    const commissionPercent = parseInt(process.env.REFERRAL_COMMISSION_PERCENT || '5', 10);
    const commissionCents = Math.round(purchaseAmountCents * (commissionPercent / 100));
    if (commissionCents <= 0) return;

    await this.prisma.transaction.create({
      data: {
        type: 'REFERRAL_COMMISSION',
        amountCents: commissionCents,
        platformFeeCents: 0,
        sellerId: code.userId,
        buyerId,
        description: `Referral commission from purchase`,
        status: 'COMPLETED',
      },
    });
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }
}
