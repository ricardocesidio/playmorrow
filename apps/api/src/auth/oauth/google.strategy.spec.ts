import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';

import { GoogleStrategy, type OAuthProfile } from './strategies/google.strategy';

describe('GoogleStrategy', () => {
  it('returns the normalized profile for NestJS Passport to complete once', () => {
    const strategy = new GoogleStrategy(
      new ConfigService({
        GOOGLE_CLIENT_ID: 'test-client-id',
        GOOGLE_CLIENT_SECRET: 'test-client-secret',
        GOOGLE_CALLBACK_URL: 'http://localhost:4000/api/auth/google/callback',
      }),
    );
    const validate = strategy.validate.bind(strategy) as (
      accessToken: string,
      refreshToken: string,
      profile: {
        id: string;
        emails?: { value: string }[];
        displayName: string;
        photos?: { value: string }[];
      },
    ) => OAuthProfile;

    expect(
      validate('', '', {
        id: 'google-123',
        emails: [{ value: 'player@example.com' }],
        displayName: 'Player',
        photos: [{ value: 'https://example.com/avatar.png' }],
      }),
    ).toEqual({
      provider: 'google',
      providerId: 'google-123',
      email: 'player@example.com',
      displayName: 'Player',
      avatarUrl: 'https://example.com/avatar.png',
    });
  });
});
