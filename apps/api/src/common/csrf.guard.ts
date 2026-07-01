import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { CsrfService } from './csrf.service';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private csrf: CsrfService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-csrf-token'];
    const user = request.user;
    if (!user || !token || !this.csrf.validateToken(user.id, token)) {
      throw new ForbiddenException('Invalid CSRF token');
    }
    return true;
  }
}
