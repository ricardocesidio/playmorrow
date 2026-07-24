import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanyProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async update(studioId: string, data: Record<string, any>) {
    const sanitized: Record<string, any> = {};

    if (data.legalName !== undefined) sanitized.legalName = this.sanitize(data.legalName);
    if (data.companySize !== undefined) sanitized.companySize = data.companySize;
    if (data.businessEmail !== undefined) sanitized.businessEmail = data.businessEmail;
    if (data.supportEmail !== undefined) sanitized.supportEmail = data.supportEmail;
    if (data.pressContact !== undefined) sanitized.pressContact = this.sanitize(data.pressContact);
    if (data.mission !== undefined) sanitized.mission = this.sanitize(data.mission);
    if (data.vision !== undefined) sanitized.vision = this.sanitize(data.vision);
    if (data.discord !== undefined) sanitized.discord = data.discord;
    if (data.twitter !== undefined) sanitized.twitter = data.twitter;
    if (data.github !== undefined) sanitized.github = data.github;
    if (data.linkedin !== undefined) sanitized.linkedin = data.linkedin;
    if (data.steamUrl !== undefined) sanitized.steamUrl = data.steamUrl;
    if (data.epicUrl !== undefined) sanitized.epicUrl = data.epicUrl;
    if (data.itchUrl !== undefined) sanitized.itchUrl = data.itchUrl;
    if (data.engine !== undefined) sanitized.engine = this.sanitize(data.engine);
    if (data.platforms !== undefined) sanitized.platforms = this.sanitize(data.platforms);
    if (data.businessDesc !== undefined) sanitized.businessDesc = this.sanitize(data.businessDesc);

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
