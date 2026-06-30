import { Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { OptionalSessionGuard } from '../auth/guards/optional-session.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { assertStudioAccess } from '../common/studio-permissions';
import { PrismaService } from '../prisma/prisma.service';
import { StudioRole } from '@playmorrow/database';
import { StudioRolesGuard } from '../studios/guards/studio-roles.guard';
import { StudioRoles } from '../studios/guards/studio-roles.decorator';
import type { Request } from 'express';

@ApiTags('Invitations')
@Controller()
export class InvitationsController {
  constructor(
    private invitationsService: InvitationsService,
    private prisma: PrismaService,
  ) {}

  @Post('studios/:slug/invitations')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Invitation created.' })
  async create(
    @Param('slug') slug: string,
    @Body() dto: CreateInvitationDto,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    const studio = await this.prisma.studio.findUnique({
      where: { slug },
      include: { members: true },
    });
    if (!studio) throw new NotFoundException('Studio not found');

    assertStudioAccess(user, studio.members, [StudioRole.OWNER, StudioRole.ADMIN]);

    if (dto.role === StudioRole.ADMIN) {
      const membership = studio.members.find(m => m.userId === user.id);
      if (!membership || membership.role !== StudioRole.OWNER) {
        throw new ForbiddenException('Only the Owner can invite Admins');
      }
    }

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip;
    const ua = req.headers['user-agent'];

    return this.invitationsService.create(studio.id, user.id, dto, ip, ua);
  }

  @Get('studios/:slug/invitations')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'List of invitations.' })
  async list(
    @Param('slug') slug: string,
    @Query('status') status: string | undefined,
    @CurrentUser() user: { id: string },
  ) {
    const studio = await this.prisma.studio.findUnique({
      where: { slug },
      include: { members: true },
    });
    if (!studio) throw new NotFoundException('Studio not found');
    assertStudioAccess(user, studio.members, [StudioRole.OWNER, StudioRole.ADMIN]);
    return this.invitationsService.findByStudio(studio.id, status);
  }

  @Delete('studios/:slug/invitations/:id')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Invitation cancelled.' })
  async cancel(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    const studio = await this.prisma.studio.findUnique({
      where: { slug },
      include: { members: true },
    });
    if (!studio) throw new NotFoundException('Studio not found');
    assertStudioAccess(user, studio.members, [StudioRole.OWNER, StudioRole.ADMIN]);
    return this.invitationsService.cancel(id, studio.id, user.id);
  }

  @Get('invitations/:token')
  @UseGuards(OptionalSessionGuard)
  @ApiOkResponse({ description: 'Invitation details.' })
  async show(@Param('token') token: string) {
    return this.invitationsService.findByToken(token);
  }

  @Post('invitations/:token/accept')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Invitation accepted.' })
  async accept(
    @Param('token') token: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.invitationsService.accept(token, user.id);
  }

  @Post('invitations/:token/decline')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Invitation declined.' })
  async decline(
    @Param('token') token: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.invitationsService.decline(token, user.id);
  }

  @Get('me/invitations')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: "Current user's pending invitations." })
  async myInvitations(@CurrentUser() user: { id: string }) {
    return this.invitationsService.findMyInvitations(user.id);
  }

  @Post('studios/:slug/request-join')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Join request created.' })
  async requestJoin(
    @Param('slug') slug: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.invitationsService.requestJoin(slug, user.id);
  }

  @Get('studios/:slug/join-requests')
  @UseGuards(SessionAuthGuard, StudioRolesGuard)
  @StudioRoles(StudioRole.OWNER, StudioRole.ADMIN)
  @ApiOkResponse({ description: 'List of join requests.' })
  async listJoinRequests(@Param('slug') slug: string) {
    return this.invitationsService.findJoinRequests(slug);
  }

  @Post('studios/:slug/join-requests/:userId/approve')
  @UseGuards(SessionAuthGuard, StudioRolesGuard)
  @StudioRoles(StudioRole.OWNER, StudioRole.ADMIN)
  @ApiOkResponse({ description: 'Join request approved.' })
  async approveJoinRequest(
    @Param('slug') slug: string,
    @Param('userId') userId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.invitationsService.approveJoinRequest(slug, userId, user.id);
  }

  @Post('studios/:slug/join-requests/:userId/reject')
  @UseGuards(SessionAuthGuard, StudioRolesGuard)
  @StudioRoles(StudioRole.OWNER, StudioRole.ADMIN)
  @ApiOkResponse({ description: 'Join request rejected.' })
  async rejectJoinRequest(
    @Param('slug') slug: string,
    @Param('userId') userId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.invitationsService.rejectJoinRequest(slug, userId, user.id);
  }
}
