import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { SupportService } from './support.service';

@ApiTags('admin/support')
@Controller('admin/support')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  @ApiOkResponse({ description: 'Paginated list of all tickets.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'department', required: false })
  @ApiQuery({ name: 'search', required: false })
  async listAllTickets(@Query() query: QueryTicketsDto): Promise<any> {
    return this.supportService.listAllTickets(query);
  }

  @Get('tickets/:id')
  @ApiOkResponse({ description: 'Single ticket detail for admin.' })
  async getTicket(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ): Promise<any> {
    return this.supportService.getTicket(id, user.id);
  }

  @Patch('tickets/:id')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOkResponse({ description: 'Ticket updated.' })
  async updateTicket(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
  ): Promise<any> {
    return this.supportService.updateTicket(id, user.id, dto, true);
  }

  @Post('tickets/:id/assign')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOkResponse({ description: 'Ticket assigned.' })
  async assignTicket(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body('assigneeId') assigneeId: string,
  ): Promise<any> {
    return this.supportService.assignTicket(id, assigneeId, user.id);
  }

  @Patch('tickets/:id/status')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOkResponse({ description: 'Ticket status changed.' })
  async changeStatus(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body('status') status: string,
  ): Promise<any> {
    return this.supportService.updateTicket(id, user.id, { status: status as any }, true);
  }
}
