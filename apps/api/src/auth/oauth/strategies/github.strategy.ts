import { Injectable, Logger } from '@nestjs/common';
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
    const clientID = configService.get<string>('GITHUB_CLIENT_ID', '');
    const clientSecret = configService.get<string>('GITHUB_CLIENT_SECRET', '');
    if (!clientID || !clientSecret) {
      Logger.warn('GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET not set — GitHub OAuth disabled');
    }
    super({
      clientID,
      clientSecret,
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL', 'http://localhost:4000/api/auth/github/callback'),
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: { id: string; emails?: { value: string }[]; username?: string; displayName?: string; photos?: { value: string }[] },
    done: (err: Error | null, user?: unknown) => void,
  ): Promise<void> {
    let email = profile.emails?.[0]?.value;
    // If GitHub didn't provide an email (user has it private), fetch it via API
    if (!email && accessToken) {
      try {
        const res = await fetch('https://api.github.com/user/emails', {
          headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' },
        });
        const emails: { email: string; primary: boolean; verified: boolean }[] = await res.json();
        const primary = emails.find((e) => e.primary && e.verified);
        if (primary) email = primary.email;
      } catch {
        // Fall through to error below
      }
    }
    if (!email) {
      done(new Error('GitHub did not provide an email. Please ensure your GitHub email is public or grant email access.'));
      return;
    }
    const profileData: OAuthProfile = {
      provider: 'github',
      providerId: profile.id,
      email,
      displayName: profile.displayName ?? profile.username ?? 'GitHub User',
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };
    done(null, profileData);
  }
}
