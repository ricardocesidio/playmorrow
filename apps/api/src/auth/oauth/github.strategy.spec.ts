import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';

import { GithubStrategy, type OAuthProfile } from './strategies/github.strategy';

describe('GithubStrategy', () => {
  it('returns the normalized profile for NestJS Passport to complete once', async () => {
    const strategy = new GithubStrategy(
      new ConfigService({
        GITHUB_CLIENT_ID: 'test-client-id',
        GITHUB_CLIENT_SECRET: 'test-client-secret',
        GITHUB_CALLBACK_URL: 'http://localhost:4000/api/auth/github/callback',
      }),
    );
    const validate = strategy.validate.bind(strategy) as (
      accessToken: string,
      refreshToken: string,
      profile: {
        id: string;
        emails?: { value: string }[];
        username?: string;
        displayName?: string;
        photos?: { value: string }[];
      },
    ) => Promise<OAuthProfile>;

    await expect(
      validate('', '', {
        id: 'github-123',
        emails: [{ value: 'player@example.com' }],
        username: 'player',
        displayName: 'Player',
        photos: [{ value: 'https://example.com/avatar.png' }],
      }),
    ).resolves.toEqual({
      provider: 'github',
      providerId: 'github-123',
      email: 'player@example.com',
      displayName: 'Player',
      avatarUrl: 'https://example.com/avatar.png',
    });
  });
});
