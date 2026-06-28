import { Controller, Get, Req, Res, UseGuards, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

import { OAuthService } from './oauth.service';
import { SessionService } from '../../session/session.service';

const FRONTEND_URL_KEY = 'WEB_ORIGIN';
const SESSION_COOKIE = 'playmorrow_session';

@ApiTags('auth')
@Controller('auth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

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
    try {
      await this.handleCallback(req, res);
    } catch (err) {
      this.logger.error('Google OAuth callback failed', err instanceof Error ? err.stack : err);
      throw err;
    }
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    try {
      await this.handleCallback(req, res);
    } catch (err) {
      this.logger.error('GitHub OAuth callback failed', err instanceof Error ? err.stack : err);
      throw err;
    }
  }

  private async handleCallback(req: Request, res: Response) {
    try {
      const profile = req.user as { provider: string; providerId: string; email: string; displayName: string; avatarUrl: string | null };

      if (!profile.email) {
        this.logger.error('Google OAuth returned no email');
        res.redirect(`${this.configService.get<string>(FRONTEND_URL_KEY, 'http://localhost:3000')}/login?error=No+email+from+Google`);
        return;
      }

      const frontendUrl = this.configService.get<string>(FRONTEND_URL_KEY, 'http://localhost:3000');

      const existingUser = await this.oauthService.findByEmail(profile.email.toLowerCase());

      if (existingUser) {
        const ua = (req.headers['user-agent'] ?? '').slice(0, 512);
        const ip = req.ip ?? req.socket?.remoteAddress;
        const { raw, expiresAt } = await this.sessionService.create(existingUser.id, ip, ua);
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie(SESSION_COOKIE, raw, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? 'none' : 'lax',
          path: '/',
          expires: expiresAt,
        });
        res.redirect(`${frontendUrl}/oauth/callback`);
      } else {
        const params = new URLSearchParams({ provider: profile.provider, email: profile.email, displayName: profile.displayName });
        if (profile.avatarUrl) params.set('avatarUrl', profile.avatarUrl);
        res.redirect(`${frontendUrl}/onboarding?${params.toString()}`);
      }
    } catch (err) {
      this.logger.error('OAuth callback error', err instanceof Error ? err.stack : err);
      const fallbackUrl = this.configService.get<string>(FRONTEND_URL_KEY, 'http://localhost:3000');
      res.redirect(`${fallbackUrl}/login?error=Authentication+failed`);
    }
  }
}
