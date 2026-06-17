import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Like JwtAuthGuard, but does not throw when no token is present.
 * Sets request.user when a valid token is provided, leaves it undefined otherwise.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = unknown>(err: Error | null, user: TUser): TUser {
    if (err || !user) {
      return undefined as TUser;
    }
    return user;
  }
}
