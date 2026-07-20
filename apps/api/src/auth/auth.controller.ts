import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { createHash } from 'node:crypto';

import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthService } from './auth.service';
import { SessionService } from '../session/session.service';
import { CsrfService } from '../common/csrf.service';
import { CsrfGuard } from '../common/csrf.guard';

const SESSION_COOKIE = 'playmorrow_session';

/**
 * Set the session cookie (`playmorrow_session`).
 *
 * SameSite strategy (cross-origin reality between Vercel frontend and Railway backend):
 * - Dev: SameSite=Lax (Next.js proxy makes requests appear same-origin; avoids Secure requirement for local HTTP).
 * - Prod: SameSite=None + Secure (required because frontend and API are different origins).
 *   SameSite=None is the minimum necessary for cookies to be sent on cross-site fetch().
 *   We cannot use Lax without a shared registrable domain (e.g. moving to *.playmorrow.app + COOKIE_DOMAIN).
 *
 * See also oauth.controller.ts for oauth_state and csrf cookies (Lax where possible).
 * If a proxy/rewrite setup on a shared domain becomes available, we can downgrade to Lax for better security.
 */
function setSessionCookie(res: Response, raw: string, expiresAt: Date) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(SESSION_COOKIE, raw, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    domain: isProduction ? process.env.COOKIE_DOMAIN || undefined : undefined,
    path: '/',
    expires: expiresAt,
  });
}

function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
    private readonly csrfService: CsrfService,
  ) {}

  // ── JWT endpoints (legacy) ───────────────────────────────────────────

  @Post('register')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiCreatedResponse({ description: 'User registered successfully.' })
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return result;
  }

  @Post('login')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Login successful.' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Tokens refreshed.' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Logged out / refresh token revoked.' })
  async logout(@Body('refreshToken') refreshToken: string) {
    await this.authService.logout(refreshToken);
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Current user profile.' })
  async me(@CurrentUser() user: { id: string }) {
    return this.authService.getProfile(user.id);
  }

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Admin-only test route.' })
  adminOnly() {
    return { message: 'Welcome, admin.' };
  }

  // ── Session-based endpoints (secure) ─────────────────────────────────

  @Post('session/login')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  async sessionLogin(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(dto.emailOrUsername, dto.password);
    const ua = (req.headers['user-agent'] ?? '').slice(0, 512);
    const ip = req.ip ?? req.socket?.remoteAddress;

    const { raw, expiresAt } = await this.sessionService.create(user.id, ip, ua);
    setSessionCookie(res, raw, expiresAt);

    const csrfToken = this.csrfService.generateToken(user.id);
    res.setHeader('X-CSRF-Token', csrfToken);

    return { id: user.id, username: user.username, displayName: user.displayName, role: user.role, accountType: user.accountType ?? 'PLAYER', csrfToken };
  }

  @Post('session/logout')
  @HttpCode(HttpStatus.OK)
  async sessionLogout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = req.cookies?.[SESSION_COOKIE];
    if (raw) {
      const hash = createHash('sha256').update(raw).digest('hex');
      await this.sessionService.revoke(hash);
    }
    clearSessionCookie(res);
    return { success: true };
  }

  @Get('session/me')
  @UseGuards(SessionAuthGuard)
  async sessionMe(@CurrentUser() user: { id: string }) {
    return this.authService.getProfile(user.id);
  }

  @Get('session/list')
  @UseGuards(SessionAuthGuard)
  async listSessions(@CurrentUser() user: { id: string }) {
    return this.sessionService.listForUser(user.id);
  }

  // ── Email verification ──────────────────────────────────────────────

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body('email') email: string, @Body('code') code: string, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.verifyEmail(email, code);
    const ua = (req.headers['user-agent'] ?? '').slice(0, 512);
    const ip = req.ip ?? req.socket?.remoteAddress;
    const { raw, expiresAt } = await this.sessionService.create(result.user.id, ip, ua);
    setSessionCookie(res, raw, expiresAt);
    return result;
  }

  @Post('resend-verification')
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body('email') email: string) {
    await this.authService.resendVerificationCode(email);
    return { message: 'If this email needs verification, a new code has been sent.' };
  }

  // ── Password reset ─────────────────────────────────────────────────

  @Post('forgot-password')
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    await this.authService.createPasswordResetToken(email);
    // Always return the same message — never reveal whether the email exists
    return { message: 'If the email exists, a reset link has been sent.' };
  }

  @Post('reset-password')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body('token') token: string, @Body('password') password: string) {
    await this.authService.resetPassword(token, password);
    return { success: true };
  }

  @Post('complete-onboarding')
  @HttpCode(HttpStatus.CREATED)
  async completeOnboarding(@Body() dto: CompleteOnboardingDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.completeOnboarding(dto);
    const ua = (req.headers['user-agent'] ?? '').slice(0, 512);
    const ip = req.ip ?? req.socket?.remoteAddress;
    const { raw, expiresAt } = await this.sessionService.create(result.user.id, ip, ua);
    setSessionCookie(res, raw, expiresAt);
    return { user: { id: result.user.id, username: result.user.username, displayName: result.user.displayName, role: result.user.role, accountType: result.user.accountType } };
  }
}
