import { Controller, Post, Req } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { logger } from './logger';

@SkipThrottle()
@Controller()
export class CspController {
  @Post('api/csp-report')
  report(@Req() req: any) {
    const report = req.body?.['csp-report'] || req.body;
    logger.warn({ msg: 'CSP violation', report });
  }
}
