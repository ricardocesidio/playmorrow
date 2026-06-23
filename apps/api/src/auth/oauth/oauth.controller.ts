import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

import { OAuthService } from './oauth.service';
import { SessionService } from '../../session/session.service';

const FRONTEND_URL_KEY = 'WEB_ORIGIN';
const SESSION_COOKIE = '__Host-playmorrow_session';

@ApiTags('auth')
@Controller('auth')
export class OAuthController {
  constructor(
    private readonly oauthService: OAuthService,
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    await this.handleCallback(req, res);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    await this.handleCallback(req, res);
  }

  private async handleCallback(req: Request, res: Response) {
    const profile = req.user as { provider: string; providerId: string; email: string; displayName: string; avatarUrl: string | null };
    const result = await this.oauthService.handleOAuthLogin(profile);
    const frontendUrl = this.configService.get<string>(FRONTEND_URL_KEY, 'http://localhost:3000');

    // Create session (preferred over JWT in URL)
    const ua = (req.headers['user-agent'] ?? '').slice(0, 512);
    const ip = req.ip ?? req.socket?.remoteAddress;
    const { raw, expiresAt } = await this.sessionService.create(result.user.id, ip, ua);
    res.cookie(SESSION_COOKIE, raw, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      expires: expiresAt,
    });

    // Redirect with minimal data — tokens are stored via session cookie
    res.redirect(`${frontendUrl}/oauth/callback`);
  }
}
