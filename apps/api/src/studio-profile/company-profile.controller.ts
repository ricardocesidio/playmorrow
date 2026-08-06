import { Body, Controller, Get, NotFoundException, Param, Patch, UseGuards } from '@nestjs/common';
import { StudioRole } from '@playmorrow/database';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { StudioRolesGuard } from '../studios/guards/studio-roles.guard';
import { StudioRoles } from '../studios/guards/studio-roles.decorator';
import { StudiosService } from '../studios/studios.service';
import { CompanyProfileService } from './company-profile.service';

@Controller('studios/:slug/company-profile')
export class CompanyProfileController {
  constructor(
    private readonly companyProfileService: CompanyProfileService,
    private readonly studiosService: StudiosService,
  ) {}

  @Get()
  @UseGuards(SessionAuthGuard)
  async get(@Param('slug') slug: string) {
    const studio = await this.studiosService.findBySlug(slug);
    if (!studio) throw new NotFoundException('Studio not found');
    return this.companyProfileService.get(studio.id);
  }

  @Patch()
  @UseGuards(SessionAuthGuard, StudioRolesGuard)
  @StudioRoles(StudioRole.OWNER, StudioRole.ADMIN)
  async update(
    @Param('slug') slug: string,
    @Body() body: Record<string, any>,
  ) {
    const studio = await this.studiosService.findBySlug(slug);
    if (!studio) throw new NotFoundException('Studio not found');
    return this.companyProfileService.update(studio.id, body);
  }
}
