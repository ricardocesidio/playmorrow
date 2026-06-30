import { SetMetadata } from '@nestjs/common';
import { StudioRole } from '@playmorrow/database';

export const STUDIO_ROLES_KEY = 'studioRoles';
export const StudioRoles = (...roles: StudioRole[]) => SetMetadata(STUDIO_ROLES_KEY, roles);
