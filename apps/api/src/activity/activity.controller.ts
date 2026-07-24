import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ActivityService } from './activity.service';

@ApiTags('activity')
@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @ApiOkResponse({ description: 'Paginated activity feed.' })
  @ApiQuery({ name: 'studioId', required: false })
  @ApiQuery({ name: 'gameId', required: false })
  @ApiQuery({ name: 'actorId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async list(
    @Query('studioId') studioId?: string,
    @Query('gameId') gameId?: string,
    @Query('actorId') actorId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize?: number,
  ): Promise<any> {
    return this.activityService.list({ studioId, gameId, actorId, page, pageSize });
  }
}
