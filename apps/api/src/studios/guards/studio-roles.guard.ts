import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { STUDIO_ROLES_KEY } from './studio-roles.decorator';
import { StudioRole } from '@playmorrow/database';

@Injectable()
export class StudioRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<StudioRole[]>(STUDIO_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('Not authenticated');

    // Global admin bypass
    if (user.role === 'ADMIN') return true;

    const slug = request.params.slug;
    if (!slug) throw new ForbiddenException('Studio slug required');

    const studio = await this.prisma.studio.findUnique({
      where: { slug },
      include: { members: true },
    });
    if (!studio) throw new ForbiddenException('Studio not found');

    const membership = studio.members.find(m => m.userId === user.id);
    if (!membership) throw new ForbiddenException('You are not a member of this studio');

    if (!requiredRoles.includes(membership.role as StudioRole)) {
      throw new ForbiddenException('Insufficient permissions for this action');
    }

    // Attach studio + membership to request for downstream use
    request.studio = studio;
    request.membership = membership;
    return true;
  }
}
