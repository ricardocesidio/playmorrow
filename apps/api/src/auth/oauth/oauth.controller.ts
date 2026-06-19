import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

import { OAuthService } from './oauth.service';

const FRONTEND_URL_KEY = 'WEB_ORIGIN';

@ApiTags('auth')
@Controller('auth')
export class OAuthController {
  constructor(
    private readonly oauthService: OAuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as { provider: string; providerId: string; email: string; displayName: string; avatarUrl: string | null };
    const result = await this.oauthService.handleOAuthLogin(profile);
    const frontendUrl = this.configService.get<string>(FRONTEND_URL_KEY, 'http://localhost:3000');
    const params = new URLSearchParams({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    res.redirect(`${frontendUrl}/oauth/callback?${params}`);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // Guard redirects to GitHub
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as { provider: string; providerId: string; email: string; displayName: string; avatarUrl: string | null };
    const result = await this.oauthService.handleOAuthLogin(profile);
    const frontendUrl = this.configService.get<string>(FRONTEND_URL_KEY, 'http://localhost:3000');
    const params = new URLSearchParams({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    res.redirect(`${frontendUrl}/oauth/callback?${params}`);
  }
}
