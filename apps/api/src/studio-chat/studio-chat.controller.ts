import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { StudioChatService } from './studio-chat.service';

@ApiTags('Studio Chat')
@Controller('studios/:slug')
export class StudioChatController {
  constructor(
    private prisma: PrismaService,
    private chatService: StudioChatService,
  ) {}

  @Get('activities')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Combined activity feed.' })
  async getFeed(@Param('slug') slug: string) {
    const studio = await this.prisma.studio.findUnique({ where: { slug } });
    if (!studio) throw new NotFoundException('Studio not found');
    return this.chatService.getFeed(studio.id);
  }

  @Post('chat')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Message posted.' })
  async postMessage(
    @Param('slug') slug: string,
    @Body() body: { message: string },
    @CurrentUser() user: { id: string },
  ) {
    const studio = await this.prisma.studio.findUnique({ where: { slug } });
    if (!studio) throw new NotFoundException('Studio not found');
    if (!body.message?.trim()) throw new BadRequestException('Message is required');
    return this.chatService.postMessage(studio.id, user.id, body.message.trim());
  }
}
