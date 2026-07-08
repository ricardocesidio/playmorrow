import { ConflictException, ForbiddenException } from '@nestjs/common';
import { StudioRole } from '@playmorrow/database';

const ROLE_SEAT_LIMITS: Record<string, number> = {
  OWNER: 2,
  ADMIN: 3,
  MODERATOR: 10,
  MEMBER: Infinity,
};

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

export function assertSeatLimit(
  members: { role: string }[],
  newRole: string,
): void {
  const limit = ROLE_SEAT_LIMITS[newRole];
  if (limit === undefined || limit === Infinity) return;
  const currentCount = members.filter((m) => m.role === newRole).length;
  if (currentCount >= limit) {
    throw new ConflictException(`SEAT_LIMIT_REACHED: Maximum ${limit} ${newRole}(s) per studio`);
  }
}

/**
 * Single unified permission helper per PRD Section 5.
 * Combines access check + seat limit enforcement in one call.
 */
export function assertPermission(
  user: { id: string; role?: string },
  members: { userId: string; role: string }[],
  allowedRoles: StudioRole[],
  newRole?: string,
): void {
  assertStudioAccess(user, members, allowedRoles);
  if (newRole) {
    assertSeatLimit(members, newRole);
  }
}
