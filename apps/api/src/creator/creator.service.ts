import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CreatorService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateCode(userId: string) {
    const existing = await this.prisma.referralCode.findUnique({ where: { userId } });
    if (existing) return existing;

    const code = this.generateCode();
    return this.prisma.referralCode.create({ data: { userId, code } });
  }

  async getMyReferrals(userId: string) {
    const code = await this.prisma.referralCode.findUnique({ where: { userId } });
    if (!code) return { code: null, commissions: [], totalEarned: 0 };

    const commissions = await this.prisma.transaction.findMany({
      where: { type: 'REFERRAL_COMMISSION', sellerId: userId },
      orderBy: { createdAt: 'desc' },
    });

    const totalEarned = commissions.reduce((s, t) => s + t.amountCents, 0);
    return { code: code.code, commissions, totalEarned };
  }

  async validateCode(code: string, userId: string) {
    const rc = await this.prisma.referralCode.findUnique({
      where: { code },
      include: { user: { select: { id: true, username: true } } },
    });
    if (!rc || rc.userId === userId) return null;
    return rc;
  }

  async applyReferral(code: string, userId: string) {
    const referralCode = await this.prisma.referralCode.findUnique({ where: { code } });
    if (!referralCode) throw new BadRequestException('Invalid referral code');
    if (referralCode.userId === userId) throw new BadRequestException('Cannot use your own referral code');

    await this.prisma.referralUsage.upsert({
      where: { referralCodeId_userId: { referralCodeId: referralCode.id, userId } },
      create: { referralCodeId: referralCode.id, userId },
      update: {},
    });

    return { applied: true, code: referralCode.code };
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }
}
