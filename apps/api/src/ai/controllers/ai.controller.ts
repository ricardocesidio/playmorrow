import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { ProviderFactory } from '../providers/provider.factory';
import { AIService } from '../services/ai.service';
import { ChatRequestDto, EmbedRequestDto, ModerationRequestDto } from '../dto/chat.dto';
import type { ChatMessage } from '../interfaces/ai-provider.interface';

@ApiTags('ai')
@Controller('ai')
export class AIController {
  constructor(
    private readonly factory: ProviderFactory,
    private readonly aiService: AIService,
  ) {}

  private toChatMessages(dtos: ChatRequestDto['messages']): ChatMessage[] {
    return dtos.map((m) => ({
      role: m.role as ChatMessage['role'],
      content: m.content,
    }));
  }

  @Post('chat')
  @UseGuards(SessionAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOkResponse({ description: 'AI chat response' })
  async chat(
    @Body() body: ChatRequestDto,
    @CurrentUser() _user: { id: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const messages = this.toChatMessages(body.messages);

    if (body.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      const provider = this.factory.getProvider();
      const stream = provider.chatStream(messages, {
        model: body.model,
        temperature: body.temperature,
        maxTokens: body.maxTokens,
      });

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    const provider = this.factory.getProvider();
    return provider.chat(messages, {
      model: body.model,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
    });
  }

  @Post('embed')
  @UseGuards(SessionAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Text embedding' })
  async embed(@Body() body: EmbedRequestDto) {
    return this.aiService.embed([body.text]);
  }

  @Post('moderate')
  @UseGuards(SessionAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Content moderation result' })
  async moderate(@Body() body: ModerationRequestDto) {
    return this.aiService.moderate(body.text);
  }

  @Get('providers')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'List of available AI providers' })
  async listProviders() {
    return this.aiService.getAvailableProviders();
  }
}
