import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@playmorrow/database';
import type { Prisma } from '@playmorrow/database';
import * as argon2 from 'argon2';
import { createHash, randomBytes, randomInt } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { TokenService } from './token.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 min

const COMMON_PASSWORDS = new Set([
  'password', 'password123', '12345678', '123456789', '1234567890',
  'qwerty123', 'qwertyuiop', 'letmein', 'welcome', 'monkey',
  'dragon', 'master', 'football', 'baseball', 'sunshine',
  'trustno1', 'iloveyou', 'princess', 'abc123', 'admin123',
]);

const CURRENT_TERMS_VERSION = '2026-06-23';
const CURRENT_PRIVACY_VERSION = '2026-06-23';
const CURRENT_COMMUNITY_GUIDELINES_VERSION = '2026-06-23';
const VERIFICATION_CODE_TTL_MINUTES = 15;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
const STUDIO_SLUG_PATTERN = /^[a-z0-9-]+$/;

function isCommonPassword(password: string): boolean {
  const lower = password.toLowerCase().replace(/[^a-z0-9]/g, '');
  return COMMON_PASSWORDS.has(lower) || COMMON_PASSWORDS.has(password.toLowerCase());
}

export interface AuthResult {
  user: { id: string; email: string; username: string; displayName: string; role: string; accountType: string; isOnboardingCompleted: boolean };
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResult {
  requiresEmailVerification: boolean;
  email: string;
  user: { id: string; displayName: string; username: string; email: string; accountType: string; emailVerifiedAt: Date | null; isOnboardingCompleted: boolean };
}

export interface VerifyEmailResult {
  user: { id: string; email: string; username: string; displayName: string; role: string; accountType: string; isOnboardingCompleted: boolean };
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

const REFRESH_EXPIRES_DAYS = 30;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateRefreshToken(): string {
  return randomBytes(48).toString('hex');
}

@Injectable()
export class AuthService {
  private readonly refreshSecret: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
  ) {
    this.refreshSecret = this.configService.getOrThrow<string>('JWT_SECRET');
  }

  async register(dto: RegisterDto): Promise<RegisterResult> {
    if (isCommonPassword(dto.password)) {
      throw new BadRequestException('This password is too common. Choose a more unique password.');
    }

    if (dto.acceptedTerms !== true || dto.acceptedPrivacy !== true) {
      throw new BadRequestException('You must accept the terms of service and privacy policy.');
    }

    const lowerPw = dto.password.toLowerCase();
    if (lowerPw.includes(dto.email.split('@')[0]!.toLowerCase())) {
      throw new BadRequestException('Password cannot contain your email.');
    }

    const passwordHash = await argon2.hash(dto.password);
    const now = new Date();
    const emailLower = dto.email.toLowerCase();
    const pendingUsername = await this.generatePendingUsername(emailLower);
    const user = await this.usersService.create({
      email: emailLower,
      username: pendingUsername,
      displayName: emailLower.split('@')[0]!,
      passwordHash,
      accountType: 'PLAYER',
      isOnboardingCompleted: false,
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      communityGuidelinesAcceptedAt: now,
      termsVersion: CURRENT_TERMS_VERSION,
      privacyVersion: CURRENT_PRIVACY_VERSION,
      communityGuidelinesVersion: CURRENT_COMMUNITY_GUIDELINES_VERSION,
      marketingOptInAt: dto.marketingOptIn ? now : undefined,
      partnerMarketingOptInAt: dto.partnerMarketingOptIn ? now : undefined,
    });

    const { raw, hash, expiresAt } = this.generateVerificationCode();
    await this.prisma.emailVerificationCode.create({
      data: { codeHash: hash, userId: user.id, expiresAt },
    });

    await this.emailService.sendVerificationCode(user.email, raw);

    return {
      requiresEmailVerification: true,
      email: user.email,
      user: {
        id: user.id, displayName: user.displayName, username: user.username,
        email: user.email, accountType: user.accountType ?? 'PLAYER',
        emailVerifiedAt: null,
        isOnboardingCompleted: false,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const isEmail = dto.emailOrUsername.includes('@');
    const user = isEmail
      ? await this.usersService.findByEmail(dto.emailOrUsername)
      : await this.usersService.findByUsername(dto.emailOrUsername);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email/username or password');
    }

    // Account lockout check
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account temporarily locked. Try again later.');
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      // Increment failed attempts
      const attempts = user.failedLoginAttempts + 1;
      const updateData: Record<string, unknown> = { failedLoginAttempts: attempts };
      if (attempts >= LOCKOUT_THRESHOLD) {
        updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      }
      await this.prisma.user.update({ where: { id: user.id }, data: updateData as Prisma.UserUpdateInput });
      throw new UnauthorizedException('Invalid email/username or password');
    }

    // Reset failed attempts on success
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException({ message: 'Please verify your email before signing in.', code: 'EMAIL_NOT_VERIFIED', email: user.email });
    }

    return this.buildResult(user);
  }

  async refresh(refreshToken: string): Promise<RefreshResult> {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!stored) throw new UnauthorizedException('Invalid or expired refresh token');

    await this.prisma.refreshToken.update({
      where: { id: stored.id }, data: { revokedAt: new Date() },
    });

    const user = await this.usersService.findById(stored.userId);
    if (!user) throw new UnauthorizedException('User not found');
    return this.issueTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() },
    });
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();
    return {
      id: user.id, email: user.email, username: user.username,
      displayName: user.displayName, role: user.role,
      isVerified: user.isVerified, accountType: user.accountType ?? 'PLAYER',
      isOnboardingCompleted: user.isOnboardingCompleted,
    };
  }

  async validateUser(emailOrUsername: string, password: string) {
    const isEmail = emailOrUsername.includes('@');
    const user = isEmail
      ? await this.usersService.findByEmail(emailOrUsername)
      : await this.usersService.findByUsername(emailOrUsername);

    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid email/username or password');
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account temporarily locked. Try again later.');
    }

    const passwordValid = await argon2.verify(user.passwordHash, password);
    if (!passwordValid) {
      const attempts = user.failedLoginAttempts + 1;
      const updateData: Record<string, unknown> = { failedLoginAttempts: attempts };
      if (attempts >= LOCKOUT_THRESHOLD) updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      await this.prisma.user.update({ where: { id: user.id }, data: updateData as Prisma.UserUpdateInput });
      throw new UnauthorizedException('Invalid email/username or password');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException({ message: 'Please verify your email before signing in.', code: 'EMAIL_NOT_VERIFIED', email: user.email });
    }

    return user;
  }

  // ── Email verification ───────────────────────────────────────────────

  async verifyEmail(email: string, code: string): Promise<VerifyEmailResult> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Invalid verification code');
    }

    if (user.emailVerifiedAt) {
      return { user: { id: user.id, email: user.email, username: user.username, displayName: user.displayName, role: user.role, accountType: user.accountType ?? 'PLAYER', isOnboardingCompleted: user.isOnboardingCompleted } };
    }

    const codeHash = createHash('sha256').update(code).digest('hex');
    const stored = await this.prisma.emailVerificationCode.findFirst({
      where: { userId: user.id, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!stored || stored.codeHash !== codeHash) {
      throw new BadRequestException('Invalid verification code');
    }

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.emailVerificationCode.update({
        where: { id: stored.id },
        data: { consumedAt: now },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: now, isVerified: true },
      }),
    ]);

    return { user: { id: user.id, email: user.email, username: user.username, displayName: user.displayName, role: user.role, accountType: user.accountType ?? 'PLAYER', isOnboardingCompleted: user.isOnboardingCompleted } };
  }

  async resendVerificationCode(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user || user.emailVerifiedAt) return;

    await this.prisma.emailVerificationCode.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    const { raw, hash, expiresAt } = this.generateVerificationCode();
    await this.prisma.emailVerificationCode.create({
      data: { codeHash: hash, userId: user.id, expiresAt },
    });

    await this.emailService.sendVerificationCode(user.email, raw);
  }

  private generateVerificationCode(): { raw: string; hash: string; expiresAt: Date } {
    const raw = randomInt(100000, 1000000).toString();
    const hash = createHash('sha256').update(raw).digest('hex');
    const expiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MINUTES * 60 * 1000);
    return { raw, hash, expiresAt };
  }

  // ── Password reset ───────────────────────────────────────────────────

  async createPasswordResetToken(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return; // Don't reveal whether email exists

    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    const token = this.tokenService.generate();
    await this.prisma.passwordResetToken.create({
      data: { tokenHash: token.hash, userId: user.id, expiresAt: token.expiresAt },
    });
    return token.raw;
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = hashToken(rawToken);
    const stored = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.consumedAt || stored.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await argon2.hash(newPassword);
    const newAuthVersion = Date.now();

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({ where: { id: stored.id }, data: { consumedAt: new Date() } }),
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { passwordHash, authVersion: newAuthVersion },
      }),
      // Revoke all sessions
      this.prisma.session.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  // ── Token helpers ────────────────────────────────────────────────────

  private async buildResult(user: User): Promise<AuthResult> {
    const tokens = await this.issueTokens(user);
    return { user: { id: user.id, email: user.email, username: user.username, displayName: user.displayName, role: user.role, accountType: user.accountType ?? 'PLAYER', isOnboardingCompleted: user.isOnboardingCompleted }, ...tokens };
  }

  private async issueTokens(user: User): Promise<RefreshResult> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const rawRefresh = generateRefreshToken();
    const tokenHash = hashToken(rawRefresh);
    await this.prisma.refreshToken.create({
      data: { tokenHash, userId: user.id, expiresAt: new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000) },
    });
    return { accessToken, refreshToken: rawRefresh };
  }

  async completeOnboarding(dto: Record<string, unknown>) {
    const accountType = dto.accountType as string;
    if (!['PLAYER', 'STUDIO'].includes(accountType)) throw new BadRequestException('Invalid account type');

    const username = (dto.username as string)?.trim();
    const usernameLowercase = username?.toLowerCase();
    if (!username || username.length < 3 || username.length > 20) throw new BadRequestException('Username must be 3-20 characters');
    if (!USERNAME_PATTERN.test(username)) throw new BadRequestException('Username can only contain letters, numbers, and underscores');

    const email = (dto.email as string)?.toLowerCase();
    if (!email) throw new BadRequestException('Email is required');

    const existingByUsername = await this.prisma.user.findFirst({ where: { usernameLowercase } });
    if (existingByUsername && existingByUsername.email !== email) throw new ConflictException('Username already taken');

    const existingEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingEmail?.isOnboardingCompleted) {
      throw new ConflictException('Email already registered');
    }

    if (accountType === 'STUDIO') {
      const studioSlug = ((dto.studioSlug as string) || username).trim().toLowerCase();
      if (!STUDIO_SLUG_PATTERN.test(studioSlug) || studioSlug.length < 3 || studioSlug.length > 40) {
        throw new BadRequestException('Studio slug must be 3-40 lowercase letters, numbers, or hyphens.');
      }
      const slugExists = await this.prisma.studio.findUnique({ where: { slug: studioSlug } });
      if (slugExists) throw new ConflictException('Studio slug already taken');
    }

    const now = new Date();
    const user = await this.prisma.$transaction(async (tx) => {
      const data = {
        email,
        username,
        usernameLowercase,
        displayName: ((dto.displayName as string) || username).trim(),
        avatarUrl: (dto.avatarUrl as string) || null,
        bio: (dto.bio as string) || null,
        location: (dto.location as string) || null,
        accountType: accountType as 'PLAYER' | 'STUDIO',
        role: 'PLAYER' as const,
        emailVerifiedAt: now,
        isVerified: true,
        isOnboardingCompleted: true,
        termsAcceptedAt: existingEmail?.termsAcceptedAt ?? now,
        privacyAcceptedAt: existingEmail?.privacyAcceptedAt ?? now,
        communityGuidelinesAcceptedAt: existingEmail?.communityGuidelinesAcceptedAt ?? now,
        termsVersion: existingEmail?.termsVersion ?? CURRENT_TERMS_VERSION,
        privacyVersion: existingEmail?.privacyVersion ?? CURRENT_PRIVACY_VERSION,
        communityGuidelinesVersion: existingEmail?.communityGuidelinesVersion ?? CURRENT_COMMUNITY_GUIDELINES_VERSION,
      };

      const completedUser = existingEmail
        ? await tx.user.update({ where: { id: existingEmail.id }, data })
        : await tx.user.create({ data: { ...data, passwordHash: null } });

      if (accountType === 'STUDIO') {
        await tx.studio.create({
          data: {
            slug: ((dto.studioSlug as string) || username).trim().toLowerCase(),
            name: ((dto.studioName as string) || (dto.displayName as string) || username).trim(),
            tagline: (dto.studioBio as string) || null,
            description: (dto.studioBio as string) || null,
            logoUrl: (dto.studioLogoUrl as string) || (dto.avatarUrl as string) || null,
            websiteUrl: (dto.websiteUrl as string) || null,
            location: (dto.location as string) || null,
            isVerified: false,
            members: { create: { userId: completedUser.id, role: 'OWNER' } },
          },
        });
      }

      return completedUser;
    });

    return { user };
  }

  async isUsernameAvailable(username: string) {
    const normalized = username.trim();
    if (normalized.length < 3 || normalized.length > 20 || !USERNAME_PATTERN.test(normalized)) {
      return { available: false, reason: 'INVALID' };
    }
    const existing = await this.prisma.user.findFirst({ where: { usernameLowercase: normalized.toLowerCase() } });
    return { available: !existing, reason: existing ? 'TAKEN' : null };
  }

  private async generatePendingUsername(email: string) {
    const base = `pending_${createHash('sha1').update(email).digest('hex').slice(0, 12)}`;
    const existing = await this.usersService.findByUsername(base);
    if (!existing) return base;
    return `pending_${randomBytes(8).toString('hex')}`;
  }
}
