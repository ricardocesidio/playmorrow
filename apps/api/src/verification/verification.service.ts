import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBus } from '../common/event-bus';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
    private readonly notifications: NotificationsService,
  ) {}

  async requestVerification(studioId: string, requestedLevel: string, documents?: any): Promise<any> {
    const existing = await this.prisma.studioVerificationRequest.findFirst({
      where: { studioId, status: 'PENDING' },
    });
    if (existing) {
      throw new BadRequestException('A pending verification request already exists');
    }

    const request = await this.prisma.studioVerificationRequest.create({
      data: {
        studioId,
        requestedLevel: requestedLevel as any,
        documents: documents ?? undefined,
      },
    });

    this.eventBus.emit({
      type: 'studio_verification_requested',
      studioId,
      metadata: { requestId: request.id, requestedLevel },
    });

    return request;
  }

  async reviewRequest(requestId: string, adminId: string, status: string, notes?: string): Promise<void> {
    const request = await this.prisma.studioVerificationRequest.findUnique({
      where: { id: requestId },
      include: { studio: { select: { id: true, name: true, slug: true } } },
    });
    if (!request) {
      throw new NotFoundException('Verification request not found');
    }

    await this.prisma.studioVerificationRequest.update({
      where: { id: requestId },
      data: {
        status: status as any,
        notes,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });

    if (status === 'APPROVED') {
      await this.prisma.studio.update({
        where: { id: request.studioId },
        data: {
          verificationStatus: request.requestedLevel,
          isVerified: true,
        },
      });

      this.eventBus.emit({
        type: 'studio_verified',
        studioId: request.studioId,
        actorId: adminId,
        metadata: { requestId, level: request.requestedLevel },
      });

      const adminIds = await this.notifications.resolveStudioAdminIdsForStudio(request.studioId);
      await this.notifications.createManyDeduped(
        adminIds.map((recipientId) => ({
          recipientId,
          actorId: adminId,
          type: 'STUDIO_VERIFIED',
          title: 'Verification Approved',
          body: `Your studio "${request.studio.name}" has been verified as ${request.requestedLevel}!`,
          targetType: 'STUDIO',
          targetId: request.studioId,
        })),
      );
    }
  }

  async getRequests(status?: string): Promise<any[]> {
    const where: any = status ? { status } : {};
    return this.prisma.studioVerificationRequest.findMany({
      where,
      include: {
        studio: { select: { id: true, name: true, slug: true, logoUrl: true } },
        reviewedBy: { select: { id: true, username: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStudioRequest(studioId: string): Promise<any> {
    return this.prisma.studioVerificationRequest.findFirst({
      where: { studioId },
      include: {
        reviewedBy: { select: { id: true, username: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
