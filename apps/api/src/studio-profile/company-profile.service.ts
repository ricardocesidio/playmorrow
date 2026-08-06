import { Injectable } from '@nestjs/common';
import type { Prisma } from '@playmorrow/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanyProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async update(studioId: string, data: Record<string, unknown>) {
    const sanitized: Prisma.StudioUncheckedUpdateInput = {};

    if (data.legalName !== undefined) sanitized.legalName = this.sanitize(data.legalName as string);
    if (data.companySize !== undefined) sanitized.companySize = data.companySize as string | null;
    if (data.businessEmail !== undefined) sanitized.businessEmail = data.businessEmail as string | null;
    if (data.supportEmail !== undefined) sanitized.supportEmail = data.supportEmail as string | null;
    if (data.pressContact !== undefined) sanitized.pressContact = this.sanitize(data.pressContact as string);
    if (data.mission !== undefined) sanitized.mission = this.sanitize(data.mission as string);
    if (data.vision !== undefined) sanitized.vision = this.sanitize(data.vision as string);
    if (data.discord !== undefined) sanitized.discord = data.discord as string | null;
    if (data.twitter !== undefined) sanitized.twitter = data.twitter as string | null;
    if (data.github !== undefined) sanitized.github = data.github as string | null;
    if (data.linkedin !== undefined) sanitized.linkedin = data.linkedin as string | null;
    if (data.steamUrl !== undefined) sanitized.steamUrl = data.steamUrl as string | null;
    if (data.epicUrl !== undefined) sanitized.epicUrl = data.epicUrl as string | null;
    if (data.itchUrl !== undefined) sanitized.itchUrl = data.itchUrl as string | null;
    if (data.engine !== undefined) sanitized.engine = this.sanitize(data.engine as string);
    if (data.platforms !== undefined) sanitized.platforms = this.sanitize(data.platforms as string);
    if (data.businessDesc !== undefined) sanitized.businessDesc = this.sanitize(data.businessDesc as string);

    return this.prisma.studio.update({
      where: { id: studioId },
      data: sanitized,
    });
  }

  async get(studioId: string) {
    return this.prisma.studio.findUnique({
      where: { id: studioId },
      select: {
        legalName: true,
        companySize: true,
        businessEmail: true,
        supportEmail: true,
        pressContact: true,
        mission: true,
        vision: true,
        discord: true,
        twitter: true,
        github: true,
        linkedin: true,
        steamUrl: true,
        epicUrl: true,
        itchUrl: true,
        engine: true,
        platforms: true,
        businessDesc: true,
        id: true,
        name: true,
        slug: true,
      },
    });
  }

  private sanitize(value: string): string {
    return value.replace(/<[^>]*>/g, '').trim();
  }
}
