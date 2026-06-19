import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SessionService } from '../../session/session.service';

const SESSION_COOKIE = '__Host-playmorrow_session';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const raw = request.cookies?.[SESSION_COOKIE];
    if (!raw) throw new UnauthorizedException();

    const result = await this.sessionService.validate(raw);
    if (!result) throw new UnauthorizedException();

    request.user = result.user;
    request.sessionId = result.session.id;
    return true;
  }
}
