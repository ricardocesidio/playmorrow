import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface PushPayload {
  title: string;
  body?: string;
  url?: string;
  icon?: string;
}

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async subscribe(userId: string, endpoint: string, p256dh: string, auth: string) {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh, auth },
      create: { userId, endpoint, p256dh, auth },
    });
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
  }

  async sendToUser(userId: string, payload: PushPayload) {
    const subs = await this.prisma.pushSubscription.findMany({ where: { userId } });
    for (const sub of subs) {
      try {
        await this.sendPush(sub.endpoint, sub.p256dh, sub.auth, payload);
      } catch (err) {
        this.logger.warn(`Push send failed for ${sub.endpoint.slice(0, 40)}...`);
        if ((err as any)?.statusCode === 410) {
          await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch((err) => this.logger.error(err));
        }
      }
    }
  }

  private async sendPush(endpoint: string, p256dh: string, auth: string, payload: PushPayload) {
    const webpush = await import('web-push');

    const vapidPublic = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
    if (!vapidPublic || !vapidPrivate) {
      this.logger.warn('VAPID keys not configured — skipping push notification');
      return;
    }

    webpush.setVapidDetails('mailto:notifications@playmorrow.com', vapidPublic, vapidPrivate);
    await webpush.sendNotification(
      { endpoint, keys: { p256dh, auth } },
      JSON.stringify(payload),
    );
  }
}
