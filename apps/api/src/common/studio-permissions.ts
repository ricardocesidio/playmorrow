import { ForbiddenException } from '@nestjs/common';

/**
 * Asserts that a user can perform a write operation on a studio.
 * Allows: studio OWNER/ADMIN members or users with global ADMIN role.
 */
export function assertStudioWriteAccess(
  user: { id: string; role?: string },
  members: { userId: string; role: string }[],
): void {
  if (user.role === 'ADMIN') {
    return;
  }

  const membership = members.find((m) => m.userId === user.id);
  if (!membership) {
    throw new ForbiddenException('You are not a member of this studio');
  }

  if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
    throw new ForbiddenException('Only studio owners and admins can perform this action');
  }
}
