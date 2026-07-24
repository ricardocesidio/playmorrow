import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudioHealthService {
  constructor(private prisma: PrismaService) {}

  async calculate(studioId: string): Promise<any> {
    const studio = await this.prisma.studio.findUnique({
      where: { id: studioId },
      include: {
        games: {
          include: {
            media: { select: { type: true } },
            pressKit: { select: { id: true } },
            roadmapItems: { select: { status: true } },
            _count: { select: { followers: true, wishlistItems: true, views: true } },
          },
        },
        _count: { select: { followers: true } },
      },
    });
    if (!studio) return null;

    const hasLogo = !!studio.logoUrl;
    const hasBanner = !!studio.bannerUrl;
    const descriptionScore = studio.description ? Math.min(studio.description.length / 200, 1) * 20 : 0;
    const totalGames = studio.games.length;
    const gamesWithTrailer = studio.games.filter((g) =>
      g.media.some((m) => m.type === 'TRAILER'),
    ).length;
    const gamesWithScreenshots = studio.games.filter((g) =>
      g.media.some((m) => m.type === 'SCREENSHOT'),
    ).length;
    const gamesWithPressKit = studio.games.filter((g) => g.pressKit).length;
    const completedRoadmaps = studio.games.filter((g) =>
      g.roadmapItems.every((r) => r.status === 'DONE' || r.status === 'CANCELLED'),
    ).length;

    const totalDevlogs = await this.prisma.devlog.count({
      where: { game: { studioId }, isPublished: true },
    });

    const totalFollowers = studio._count.followers;
    const totalViews = studio.games.reduce((s, g) => s + (g._count.views ?? 0), 0);

    const recommendations: string[] = [];

    let profileScore = 0;
    if (hasLogo) profileScore += 15;
    if (hasBanner) profileScore += 5;
    profileScore += descriptionScore;

    let mediaScore = 0;
    if (gamesWithTrailer > 0) mediaScore += 15;
    else recommendations.push('Upload a trailer');
    if (gamesWithScreenshots > 0) mediaScore += 10;
    else recommendations.push('Add screenshots');
    if (gamesWithPressKit > 0) mediaScore += 10;
    else recommendations.push('Complete your Press Kit');

    let contentScore = 0;
    if (totalDevlogs > 0) contentScore += 10;
    else recommendations.push('Publish your first devlog');
    if (totalDevlogs >= 5) contentScore += 5;
    if (completedRoadmaps > 0) contentScore += 5;
    else recommendations.push('Complete your Roadmap');

    let growthScore = 0;
    if (totalFollowers >= 100) growthScore += 5;
    else recommendations.push('Reach 100 followers');
    if (totalFollowers >= 500) growthScore += 5;
    if (totalViews >= 1000) growthScore += 5;

    const score = Math.min(profileScore + mediaScore + contentScore + growthScore, 100);

    let level: string;
    if (score >= 80) level = 'EXCELLENT';
    else if (score >= 60) level = 'GOOD';
    else if (score >= 30) level = 'NEEDS_ATTENTION';
    else level = 'INCOMPLETE';

    const breakdown = {
      profile: { score: profileScore, max: 40 },
      media: { score: mediaScore, max: 35 },
      content: { score: contentScore, max: 20 },
      growth: { score: growthScore, max: 15 },
    };

    const healthScore = await this.prisma.studioHealthScore.create({
      data: {
        studioId,
        score,
        level,
        breakdown,
        recommendations,
      },
    });

    return healthScore;
  }

  async getHealth(studioId: string): Promise<any> {
    return this.prisma.studioHealthScore.findFirst({
      where: { studioId },
      orderBy: { calculatedAt: 'desc' },
    });
  }
}
