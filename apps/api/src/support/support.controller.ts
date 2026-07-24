import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { ApiCreatedResponse, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { SupportService } from './support.service';

@ApiTags('support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @UseGuards(SessionAuthGuard)
  @ApiCreatedResponse({ description: 'Support ticket created.' })
  async createTicket(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateTicketDto,
  ): Promise<any> {
    return this.supportService.createTicket(user.id, dto);
  }

  @Get('tickets')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Paginated list of my tickets.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'department', required: false })
  async listMyTickets(
    @CurrentUser() user: { id: string },
    @Query() query: QueryTicketsDto,
  ): Promise<any> {
    return this.supportService.listMyTickets(user.id, query);
  }

  @Get('tickets/:id')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Ticket detail.' })
  async getTicket(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ): Promise<any> {
    return this.supportService.getTicket(id, user.id);
  }

  @Post('tickets/:id/replies')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @UseGuards(SessionAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiCreatedResponse({ description: 'Reply added to ticket.' })
  async addReply(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: CreateReplyDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<any> {
    return this.supportService.addReply(id, user.id, dto, files);
  }

  @Get('tickets/:id/replies')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'List of replies for a ticket.' })
  async listReplies(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ): Promise<any> {
    return this.supportService.listReplies(id, user.id);
  }

  @Get('categories')
  @ApiOkResponse({ description: 'List of support categories.' })
  async listCategories(): Promise<any> {
    return this.supportService.getCategories();
  }
}
