import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';

export interface OAuthProfile {
  provider: string;
  providerId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID') ?? 'noop',
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET') ?? 'noop',
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL', 'http://localhost:4000/api/auth/github/callback'),
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: { id: string; emails?: { value: string }[]; username?: string; displayName?: string; photos?: { value: string }[] },
    done: (err: Error | null, user?: unknown) => void,
  ): Promise<void> {
    const profileData: OAuthProfile = {
      provider: 'github',
      providerId: profile.id,
      email: profile.emails?.[0]?.value ?? `${profile.username ?? 'user'}@github.oauth`,
      displayName: profile.displayName ?? profile.username ?? 'GitHub User',
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };
    done(null, profileData);
  }
}
