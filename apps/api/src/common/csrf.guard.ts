import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { CsrfService } from './csrf.service';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly csrf: CsrfService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Read-only methods don't need CSRF
    const method = request.method;
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true;

    // Unauthenticated requests don't need CSRF
    const user = request.user;
    if (!user) return true;

    // Authenticated mutation requires a valid CSRF token
    const token = request.headers['x-csrf-token'];
    if (!token || !this.csrf.validateToken(user.id, token)) {
      throw new ForbiddenException('Invalid or missing CSRF token');
    }
    return true;
  }
}
