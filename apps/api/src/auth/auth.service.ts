import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@playmorrow/database';
import type { Prisma } from '@playmorrow/database';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
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

function isCommonPassword(password: string): boolean {
  const lower = password.toLowerCase().replace(/[^a-z0-9]/g, '');
  return COMMON_PASSWORDS.has(lower) || COMMON_PASSWORDS.has(password.toLowerCase());
}

export interface AuthResult {
  user: { id: string; email: string; username: string; displayName: string; role: string; accountType: string };
  accessToken: string;
  refreshToken: string;
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
  ) {
    this.refreshSecret = this.configService.getOrThrow<string>('JWT_SECRET');
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    if (isCommonPassword(dto.password)) {
      throw new BadRequestException('This password is too common. Choose a more unique password.');
    }

    const accountType = dto.accountType ?? 'PLAYER';
    if (!['PLAYER', 'STUDIO'].includes(accountType)) {
      throw new BadRequestException('accountType must be PLAYER or STUDIO');
    }

    // Also reject passwords containing email or username parts
    const lowerPw = dto.password.toLowerCase();
    if (lowerPw.includes(dto.email.split('@')[0]!.toLowerCase()) || lowerPw.includes(dto.username.toLowerCase())) {
      throw new BadRequestException('Password cannot contain your email or username.');
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.usersService.create({
      email: dto.email, username: dto.username, displayName: dto.displayName, passwordHash,
      accountType,
    });

    // Create verification token
    const token = this.tokenService.generate();
    await this.prisma.verificationToken.create({
      data: { tokenHash: token.hash, userId: user.id, expiresAt: token.expiresAt },
    });

    return this.buildResult(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const isEmail = dto.emailOrUsername.includes('@');
    const user = isEmail
      ? await this.usersService.findByEmail(dto.emailOrUsername)
      : await this.usersService.findByUsername(dto.emailOrUsername);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
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
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts on success
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

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
    };
  }

  async validateUser(emailOrUsername: string, password: string) {
    const isEmail = emailOrUsername.includes('@');
    const user = isEmail
      ? await this.usersService.findByEmail(emailOrUsername)
      : await this.usersService.findByUsername(emailOrUsername);

    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account temporarily locked. Try again later.');
    }

    const passwordValid = await argon2.verify(user.passwordHash, password);
    if (!passwordValid) {
      const attempts = user.failedLoginAttempts + 1;
      const updateData: Record<string, unknown> = { failedLoginAttempts: attempts };
      if (attempts >= LOCKOUT_THRESHOLD) updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      await this.prisma.user.update({ where: { id: user.id }, data: updateData as Prisma.UserUpdateInput });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    return user;
  }

  // ── Email verification ───────────────────────────────────────────────

  async createVerificationToken(userId: string) {
    // Invalidate previous tokens
    await this.prisma.verificationToken.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    const token = this.tokenService.generate();
    await this.prisma.verificationToken.create({
      data: { tokenHash: token.hash, userId, expiresAt: token.expiresAt },
    });
    return token.raw;
  }

  async verifyEmail(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    const stored = await this.prisma.verificationToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.consumedAt || stored.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.$transaction([
      this.prisma.verificationToken.update({ where: { id: stored.id }, data: { consumedAt: new Date() } }),
      this.prisma.user.update({ where: { id: stored.userId }, data: { isVerified: true } }),
    ]);
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
    return { user: { id: user.id, email: user.email, username: user.username, displayName: user.displayName, role: user.role, accountType: user.accountType ?? 'PLAYER' }, ...tokens };
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
}
