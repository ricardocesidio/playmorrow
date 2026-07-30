import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipCsrf } from '../common/skip-csrf.decorator';
import { PrismaService } from '../prisma/prisma.service';
import type { Response } from 'express';

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
    if (url) {
      await this.prisma.emailLog.update({
        where: { id: logId },
        data: { clickedAt: new Date() },
      }).catch(() => {});
      res.redirect(302, url);
    } else {
      res.status(400).json({ error: 'Missing url parameter' });
    }
  }
}
