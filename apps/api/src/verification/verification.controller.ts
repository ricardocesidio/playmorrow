import { Body, Controller, Get, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationService } from './verification.service';

@Controller('studios/:slug/verification')
export class VerificationController {
  constructor(
    private readonly verificationService: VerificationService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @UseGuards(SessionAuthGuard)
  async requestVerification(
    @Param('slug') slug: string,
    @CurrentUser() user: { id: string },
    @Body() body: { requestedLevel: string; documents?: any },
  ): Promise<any> {
    const studio = await this.prisma.studio.findUnique({ where: { slug } });
    if (!studio) throw new NotFoundException('Studio not found');
    return this.verificationService.requestVerification(studio.id, body.requestedLevel, body.documents);
  }

  @Get()
  @UseGuards(SessionAuthGuard)
  async getStatus(@Param('slug') slug: string): Promise<any> {
    const studio = await this.prisma.studio.findUnique({ where: { slug } });
    if (!studio) throw new NotFoundException('Studio not found');
    const request = await this.verificationService.getStudioRequest(studio.id);
    return {
      studioId: studio.id,
      studioName: studio.name,
      studioSlug: studio.slug,
      verificationStatus: studio.verificationStatus,
      trustScore: studio.trustScore,
      currentRequest: request,
    };
  }
}
