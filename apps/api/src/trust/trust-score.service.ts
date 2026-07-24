import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBus } from '../common/event-bus';

@Injectable()
export class TrustScoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async calculate(studioId: string): Promise<number> {
    const studio = await this.prisma.studio.findUnique({
      where: { id: studioId },
      include: { brandKit: true, pressKit: true },
    });
    if (!studio) throw new NotFoundException('Studio not found');

    let score = 0;

    const tierScores: Record<string, number> = {
      UNVERIFIED: 0,
      EMAIL_VERIFIED: 5,
      BASIC_VERIFIED: 15,
      OFFICIAL_STUDIO: 20,
      PARTNER_STUDIO: 25,
      FEATURED_STUDIO: 30,
    };
    score += tierScores[studio.verificationStatus] ?? 0;

    const profileFields = [studio.legalName, studio.businessEmail, studio.companySize, studio.mission];
    const filledProfile = profileFields.filter(Boolean).length;
    score += Math.round((filledProfile / profileFields.length) * 20);

    const socialLinks = [studio.discord, studio.twitter, studio.github].filter(Boolean).length;
    score += Math.round((socialLinks / 3) * 15);

    const platformLinks = [studio.steamUrl, studio.epicUrl, studio.itchUrl].filter(Boolean).length;
    score += Math.round((platformLinks / 3) * 15);

    if (studio.pressKit) score += 10;
    if (studio.brandKit) score += 10;

    const previousScore = studio.trustScore;

    await this.prisma.studio.update({
      where: { id: studioId },
      data: { trustScore: score },
    });

    this.eventBus.emit({
      type: 'trust_score_updated',
      studioId,
      metadata: { score, previousScore },
    });

    return score;
  }
}
