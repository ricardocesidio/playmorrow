import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
/** Studio-level press kits — CRUD for press kit data attached to studios (branding, logos, history, awards, press contacts, etc.) */
export class StudioPressKitService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(studioId: string, data: Record<string, any>): Promise<any> {
    const allowedFields: Record<string, any> = {};
    if (data.headline !== undefined) allowedFields.headline = data.headline;
    if (data.factSheet !== undefined) allowedFields.factSheet = data.factSheet;
    if (data.awards !== undefined) allowedFields.awards = data.awards;
    if (data.pressContacts !== undefined) allowedFields.pressContacts = data.pressContacts;
    if (data.history !== undefined) allowedFields.history = data.history;
    if (data.logos !== undefined) allowedFields.logos = data.logos;
    if (data.keyArt !== undefined) allowedFields.keyArt = data.keyArt;
    if (data.trailerUrl !== undefined) allowedFields.trailerUrl = data.trailerUrl;
    if (data.downloads !== undefined) allowedFields.downloads = data.downloads;

    return this.prisma.studioPressKit.upsert({
      where: { studioId },
      create: { studioId, ...allowedFields },
      update: allowedFields,
    });
  }

  async get(studioId: string): Promise<any> {
    return this.prisma.studioPressKit.findUnique({ where: { studioId } });
  }
}
