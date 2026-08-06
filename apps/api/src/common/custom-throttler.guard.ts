import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Custom ThrottlerGuard for per-user rate limiting.
 * Falls back to IP if no authenticated user.
 * Addresses the audit TODO for per-user limiting beyond IP-only.
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, unknown>): Promise<string> {
    const user = req.user;
    if (user && typeof user === 'object') {
      const userId = (user as { id?: string }).id;
      if (userId) {
        return `user:${userId}`;
      }
    }
    // Fallback to IP for unauthenticated or public routes
    return req.ip as string;
  }
}