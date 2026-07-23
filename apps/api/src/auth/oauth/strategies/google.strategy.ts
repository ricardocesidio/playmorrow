import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import type { VerifyCallback } from 'passport-google-oauth20';

export interface OAuthProfile {
  provider: string;
  providerId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID') || 'missing';
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET') || 'missing';
    if (clientID === 'missing' || clientSecret === 'missing') {
      Logger.warn('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set — Google OAuth disabled');
    }
    super({
      clientID,
      clientSecret,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL', 'http://localhost:4000/api/auth/google/callback'),
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: { id: string; emails?: { value: string }[]; displayName: string; photos?: { value: string }[] },
    done: VerifyCallback,
  ): void {
    const profileData: OAuthProfile = {
      provider: 'google',
      providerId: profile.id,
      email: profile.emails?.[0]?.value ?? '',
      displayName: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };
    done(null, profileData);
  }
}
