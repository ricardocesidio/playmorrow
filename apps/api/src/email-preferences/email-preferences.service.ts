import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'node:crypto';

@Injectable()
export class EmailPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(userId: string) {
    let pref = await this.prisma.emailPreference.findUnique({ where: { userId } });
    if (!pref) {
      pref = await this.prisma.emailPreference.create({
        data: { userId, unsubscribeToken: crypto.randomBytes(24).toString('hex') },
      });
    }
    return pref;
  }

  async update(userId: string, data: {
    marketingOptIn?: boolean;
    digestFrequency?: string;
    devlogNotifications?: boolean;
    wishlistNotifications?: boolean;
    releaseNotifications?: boolean;
    followNotifications?: boolean;
  }) {
    await this.getOrCreate(userId);
    return this.prisma.emailPreference.update({ where: { userId }, data });
  }

  async unsubscribeByToken(token: string) {
    const pref = await this.prisma.emailPreference.findUnique({ where: { unsubscribeToken: token } });
    if (!pref) throw new NotFoundException('Invalid unsubscribe link');
    return this.prisma.emailPreference.update({
      where: { id: pref.id },
      data: { marketingOptIn: false, devlogNotifications: false, wishlistNotifications: false, releaseNotifications: false, followNotifications: false },
    });
  }

  async getByToken(token: string) {
    const pref = await this.prisma.emailPreference.findUnique({ where: { unsubscribeToken: token } });
    if (!pref) throw new NotFoundException('Invalid unsubscribe link');

    const user = await this.prisma.user.findUnique({ where: { id: pref.userId }, select: { email: true, displayName: true } });
    return { ...pref, user };
  }
}
