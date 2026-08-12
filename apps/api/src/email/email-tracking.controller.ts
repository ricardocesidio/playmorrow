import { Controller, Get, Param, Query, Res, BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipCsrf } from '../common/skip-csrf.decorator';
import { PrismaService } from '../prisma/prisma.service';
import type { Response } from 'express';

const ALLOWED_REDIRECT_HOSTS = new Set([
  'playmorrow.co',
  'www.playmorrow.co',
  'playmorrow.vercel.app',
]);

function isValidRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    if (parsed.username || parsed.password) return false;
    return ALLOWED_REDIRECT_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

@ApiTags('email/tracking')
@Controller('email/track')
@SkipCsrf()
export class EmailTrackingController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('open/:logId')
  async trackOpen(@Param('logId') logId: string, @Res() res: Response) {
    await this.prisma.emailLog.update({
      where: { id: logId },
      data: { openedAt: new Date() },
    }).catch(() => {});
    // 1x1 transparent GIF pixel
    res.set('Content-Type', 'image/gif');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
  }

  @Get('click/:logId')
  async trackClick(@Param('logId') logId: string, @Query('url') url: string, @Res() res: Response) {
    if (url && isValidRedirectUrl(url)) {
      await this.prisma.emailLog.update({
        where: { id: logId },
        data: { clickedAt: new Date() },
      }).catch(() => {});
      res.redirect(302, url);
    } else {
      throw new BadRequestException('Invalid or missing url parameter');
    }
  }
}
