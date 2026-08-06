import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { VerificationRequestStatus } from '@playmorrow/database';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { VerificationService } from './verification.service';

@Controller('admin/verification')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminVerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get()
  async listRequests(@Query('status') status?: VerificationRequestStatus): Promise<
    Awaited<ReturnType<VerificationService['getRequests']>>
  > {
    return this.verificationService.getRequests(status);
  }

  @Patch(':id')
  async reviewRequest(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: { status: VerificationRequestStatus; notes?: string },
  ): Promise<{ success: boolean }> {
    await this.verificationService.reviewRequest(id, user.id, body.status, body.notes);
    return { success: true };
  }
}
