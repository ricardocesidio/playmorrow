import { Controller, Get, Req, Res, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import * as passport from 'passport';
import { randomBytes } from 'node:crypto';

import { CsrfService } from '../../common/csrf.service';
import { setSessionCookie } from '../../common/cookie-helper';
import { OAuthService } from './oauth.service';
import { SessionService } from '../../session/session.service';

import type { OAuthProfile } from './strategies/github.strategy';

const FRONTEND_URL_KEY = 'WEB_ORIGIN';

@ApiTags('auth')
@Controller('auth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

  constructor(
    private readonly oauthService: OAuthService,
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
    private readonly csrfService: CsrfService,
  ) {}

  @Get('google')
  async googleAuth(@Req() req: Request, @Res() res: Response) {
    const state = randomBytes(32).toString('hex');
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60 * 1000,
    });
    return new Promise<void>((resolve) => {
      passport.authenticate('google', { state, session: false })(req, res, () => resolve());
    });
  }

  @Get('google/callback')
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>(FRONTEND_URL_KEY, 'http://localhost:3000');
    if (!this.validateState(req, res)) {
      return res.redirect(`${frontendUrl}/login?error=Invalid+OAuth+state`);
    }
    return new Promise<void>((resolve) => {
      passport.authenticate('google', { session: false }, async (err: unknown, profile: OAuthProfile) => {
        if (err || !profile) {
          this.logger.error('Google OAuth authentication failed', err);
          res.redirect(`${frontendUrl}/login?error=Authentication+failed`);
          return resolve();
        }
        try {
          await this.handleCallback(profile, req, res);
        } catch (cbErr) {
          this.logger.error('OAuth callback handler failed', cbErr instanceof Error ? cbErr.stack : cbErr);
          res.redirect(`${frontendUrl}/login?error=Authentication+failed`);
        }
        resolve();
      })(req, res, () => {});
    });
  }

  @Get('github')
  async githubAuth(@Req() req: Request, @Res() res: Response) {
    const state = randomBytes(32).toString('hex');
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60 * 1000,
    });
    return new Promise<void>((resolve) => {
      passport.authenticate('github', { state, session: false })(req, res, () => resolve());
    });
  }

  @Get('github/callback')
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>(FRONTEND_URL_KEY, 'http://localhost:3000');
    if (!this.validateState(req, res)) {
      return res.redirect(`${frontendUrl}/login?error=Invalid+OAuth+state`);
    }
    return new Promise<void>((resolve) => {
      passport.authenticate('github', { session: false }, async (err: unknown, profile: OAuthProfile) => {
        if (err || !profile) {
          this.logger.error('GitHub OAuth authentication failed', err);
          res.redirect(`${frontendUrl}/login?error=Authentication+failed`);
          return resolve();
        }
        try {
          await this.handleCallback(profile, req, res);
        } catch (cbErr) {
          this.logger.error('OAuth callback handler failed', cbErr instanceof Error ? cbErr.stack : cbErr);
          res.redirect(`${frontendUrl}/login?error=Authentication+failed`);
        }
        resolve();
      })(req, res, () => {});
    });
  }

  private validateState(req: Request, res: Response): boolean {
    const returnedState = req.query.state as string | undefined;
    const cookieState = req.cookies?.oauth_state as string | undefined;
    res.clearCookie('oauth_state', { path: '/' });
    if (!returnedState || !cookieState || returnedState !== cookieState) {
      this.logger.warn('OAuth state mismatch — possible CSRF attack on OAuth callback');
      return false;
    }
    return true;
  }

  private async handleCallback(profile: OAuthProfile, req: Request, res: Response) {
    try {
      if (!profile.email) {
        this.logger.error('OAuth provider returned no email');
        const frontendUrl = this.configService.get<string>(FRONTEND_URL_KEY, 'http://localhost:3000');
        res.redirect(`${frontendUrl}/login?error=No+email+from+OAuth+provider`);
        return;
      }

      const frontendUrl = this.configService.get<string>(FRONTEND_URL_KEY, 'http://localhost:3000');
      const existingUser = await this.oauthService.findByEmail(profile.email.toLowerCase());

      if (existingUser) {
        const ua = (req.headers['user-agent'] ?? '').slice(0, 512);
        const ip = req.ip ?? req.socket?.remoteAddress;
        const { raw, expiresAt } = await this.sessionService.create(existingUser.id, ip, ua);
        setSessionCookie(res, raw, expiresAt);

        const csrfToken = this.csrfService.generateToken(existingUser.id);
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('playmorrow_csrf', csrfToken, {
          httpOnly: false,
          secure: isProd,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24,
        });

        res.redirect(`${frontendUrl}/oauth/callback#csrf=${csrfToken}`);
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
