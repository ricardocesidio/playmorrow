import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiKeysService } from './api-keys.service';

@ApiTags('api-keys')
@Controller('api-keys')
@UseGuards(SessionAuthGuard)
export class ApiKeysController {
  constructor(private readonly svc: ApiKeysService) {}

  @Post()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Create a new API key' })
  async create(@CurrentUser() user: { id: string }, @Body() body: { name: string; scopes?: string[] }) {
    return this.svc.create(user.id, body.name, body.scopes);
  }

  @Get()
  @ApiOperation({ summary: 'List all API keys' })
  async list(@CurrentUser() user: { id: string }) {
    return this.svc.list(user.id);
  }

  @Delete(':id')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Revoke an API key' })
  async revoke(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.svc.revoke(user.id, id);
  }
}
