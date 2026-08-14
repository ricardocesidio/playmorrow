import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService, type RegisterResult } from './auth.service';
import type { UsersService } from '../users/users.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { EmailService } from '../email/email.service';
import type { EmailSenderService } from '../email/email-sender.service';
import type { NotificationsService } from '../notifications/notifications.service';
import type { JwtService } from '@nestjs/jwt';
import type { TokenService } from './token.service';
import type { TotpService } from './totp.service';

describe('AuthService.register (unit)', () => {
  let authService: AuthService;
  let emailService: { sendVerificationCode: ReturnType<typeof vi.fn>; sendInvitationEmail: ReturnType<typeof vi.fn>; sendPasswordResetEmail: ReturnType<typeof vi.fn> };
  let emailSender: { sendRaw: ReturnType<typeof vi.fn>; sendTemplate: ReturnType<typeof vi.fn> };

  const user = {
    id: 'usr-test',
    email: 'newuser@example.com',
    username: 'pending_abc123',
    displayName: 'newuser',
    accountType: 'PLAYER',
    isOnboardingCompleted: false,
  };

  beforeEach(() => {
    emailService = {
      sendVerificationCode: vi.fn().mockResolvedValue(undefined),
      sendInvitationEmail: vi.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    };
    emailSender = {
      sendRaw: vi.fn().mockResolvedValue(true),
      sendTemplate: vi.fn().mockResolvedValue(true),
    };

    const usersService = {
      create: vi.fn().mockResolvedValue(user),
      findByUsername: vi.fn().mockResolvedValue(null),
    } as unknown as UsersService;

    const prisma = {
      emailVerificationCode: { create: vi.fn().mockResolvedValue({}) },
    } as unknown as PrismaService;

    const configService = {
      get: vi.fn((_key: string, fallback?: unknown) => fallback ?? null),
      getOrThrow: vi.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'test-jwt-secret';
        return null;
      }),
    } as never;

    authService = new AuthService(
      usersService,
      {} as unknown as JwtService,
      prisma,
      configService,
      {} as unknown as TokenService,
      {} as unknown as TotpService,
      emailService as unknown as EmailService,
      { create: vi.fn().mockResolvedValue({}) } as unknown as NotificationsService,
      emailSender as unknown as EmailSenderService,
    );
  });

  it('registers a player and returns requiresEmailVerification', async () => {
    const result: RegisterResult = await authService.register({
      email: 'newuser@example.com',
      password: 'StrongPass123!',
      acceptedTerms: true,
      acceptedPrivacy: true,
    });

    expect(result.requiresEmailVerification).toBe(true);
    expect(result.user.email).toBe('newuser@example.com');
    expect(result.user.emailVerifiedAt).toBeNull();
  });

  it('sends the verification code exactly once via EmailService (no duplicate via EmailSenderService.sendRaw)', async () => {
    await authService.register({
      email: 'newuser@example.com',
      password: 'StrongPass123!',
      acceptedTerms: true,
      acceptedPrivacy: true,
    });

    expect(emailService.sendVerificationCode).toHaveBeenCalledTimes(1);
    expect(emailService.sendVerificationCode).toHaveBeenCalledWith('newuser@example.com', expect.any(String));
    expect(emailSender.sendRaw).not.toHaveBeenCalled();
  });
});
