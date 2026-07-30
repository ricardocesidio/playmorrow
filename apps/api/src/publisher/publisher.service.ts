import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublisherService {
  constructor(private prisma: PrismaService) {}

  private async getStudioMemberIds(studioId: string): Promise<string[]> {
    const members = await this.prisma.studioMember.findMany({
      where: { studioId },
      select: { userId: true },
    });
    return members.map((m) => m.userId);
  }

  async getStudioRevenue(studioId: string) {
    const memberIds = await this.getStudioMemberIds(studioId);
    const transactions = await this.prisma.transaction.findMany({
      where: { sellerId: { in: memberIds }, status: 'COMPLETED', type: 'PURCHASE' },
      orderBy: { createdAt: 'desc' },
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + t.amountCents, 0);
    const totalFees = transactions.reduce((sum, t) => sum + t.platformFeeCents, 0);
    const totalSales = transactions.length;

    return { totalRevenue, totalFees, netRevenue: totalRevenue - totalFees, totalSales, transactions };
  }

  async getStudioRevenueByPeriod(studioId: string, days = 30) {
    const memberIds = await this.getStudioMemberIds(studioId);
    const since = new Date(Date.now() - days * 86400000);
    const transactions = await this.prisma.transaction.findMany({
      where: {
        sellerId: { in: memberIds },
        status: 'COMPLETED',
        type: 'PURCHASE',
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
    });

    const dailyMap = new Map<string, { revenue: number; fees: number; sales: number }>();
    for (const t of transactions) {
      const day = t.createdAt.toISOString().slice(0, 10);
      const entry = dailyMap.get(day) || { revenue: 0, fees: 0, sales: 0 };
      entry.revenue += t.amountCents;
      entry.fees += t.platformFeeCents;
      entry.sales += 1;
      dailyMap.set(day, entry);
    }

    const daily = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRevenue: transactions.reduce((s, t) => s + t.amountCents, 0),
      totalFees: transactions.reduce((s, t) => s + t.platformFeeCents, 0),
      totalSales: transactions.length,
      daily,
    };
  }

  async getUserRevenue(userId: string) {
    const memberships = await this.prisma.studioMember.findMany({
      where: { userId, role: { in: ['OWNER', 'ADMIN'] } },
      include: { studio: { select: { id: true, name: true, slug: true } } },
    });

    const results = [];
    for (const membership of memberships) {
      const revenue = await this.getStudioRevenue(membership.studioId);
      results.push({ studio: membership.studio, ...revenue });
    }

    return results;
  }
}
