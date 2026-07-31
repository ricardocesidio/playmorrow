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

  async validateCode(code: string, userId: string) {
    const rc = await this.prisma.referralCode.findUnique({
      where: { code },
      include: { user: { select: { id: true, username: true } } },
    });
    if (!rc || rc.userId === userId) return null;
    return rc;
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }
}
