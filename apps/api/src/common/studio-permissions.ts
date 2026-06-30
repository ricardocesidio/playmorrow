import { ForbiddenException } from '@nestjs/common';
import { StudioRole } from '@playmorrow/database';

export function assertStudioAccess(
  user: { id: string; role?: string },
  members: { userId: string; role: string }[],
  allowedRoles: StudioRole[],
): void {
  if (user.role === 'ADMIN') return;

  const membership = members.find((m) => m.userId === user.id);
  if (!membership) {
    throw new ForbiddenException('You are not a member of this studio');
  }
  if (!allowedRoles.includes(membership.role as StudioRole)) {
    throw new ForbiddenException('Insufficient permissions');
  }
}
