import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { StudioRolesGuard } from '../studios/guards/studio-roles.guard';
import { StudioRoles } from '../studios/guards/studio-roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { StudioRole } from '@playmorrow/database';

@ApiTags('Audit Logs')
@Controller('studios/:slug/audit-logs')
@UseGuards(SessionAuthGuard, StudioRolesGuard)
@StudioRoles(StudioRole.OWNER, StudioRole.ADMIN)
export class AuditLogController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOkResponse({ description: 'Paginated audit logs.' })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Param('slug') slug: string,
    @Query('limit') limit?: string,
  ): Promise<{ items: unknown[]; total: number }> {
    const studio = await this.prisma.studio.findUnique({ where: { slug } });
    if (!studio) return { items: [], total: 0 };

    const logs = await this.prisma.auditLog.findMany({
      where: { studioId: studio.id },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit || '50', 10) || 50, 100),
      include: {
        actor: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
      },
    });

    const total = await this.prisma.auditLog.count({ where: { studioId: studio.id } });

    return { items: logs, total };
  }
}
