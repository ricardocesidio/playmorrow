import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
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
  async listRequests(@Query('status') status?: string): Promise<any[]> {
    return this.verificationService.getRequests(status);
  }

  @Patch(':id')
  async reviewRequest(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: { status: string; notes?: string },
  ): Promise<any> {
    await this.verificationService.reviewRequest(id, user.id, body.status, body.notes);
    return { success: true };
  }
}
