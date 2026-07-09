import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Custom ThrottlerGuard for per-user rate limiting.
 * Falls back to IP if no authenticated user.
 * Addresses the audit TODO for per-user limiting beyond IP-only.
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const userId = req.user?.id;
    if (userId) {
      return `user:${userId}`;
    }
    // Fallback to IP for unauthenticated or public routes
    return req.ip;
  }
}