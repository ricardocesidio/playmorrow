import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateStudioDto } from './dto/create-studio.dto';
import { UpdateStudioDto } from './dto/update-studio.dto';
import { StudiosService } from './studios.service';

@ApiTags('studios')
@Controller('studios')
export class StudiosController {
  constructor(private readonly studiosService: StudiosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Studio created.' })
  async create(@CurrentUser() user: { id: string }, @Body() dto: CreateStudioDto) {
    return this.studiosService.create(user.id, dto);
  }

  @Get()
  @ApiOkResponse({ description: 'Paginated list of studios.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('search') search?: string,
  ) {
    return this.studiosService.findAll(page, Math.min(pageSize, 100), search);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: "Current user's studios." })
  async findMyStudios(@CurrentUser() user: { id: string }) {
    return this.studiosService.findMyStudios(user.id);
  }

  @Get(':slug')
  @ApiOkResponse({ description: 'Studio profile.' })
  async findBySlug(@Param('slug') slug: string) {
    const studio = await this.studiosService.findBySlug(slug);
    if (!studio) {
      throw new NotFoundException('Studio not found');
    }
    return studio;
  }

  @Get(':slug/members')
  @ApiOkResponse({ description: 'Studio members list.' })
  async findMembers(@Param('slug') slug: string) {
    const studio = await this.studiosService.findBySlugWithMembers(slug);
    if (!studio) {
      throw new NotFoundException('Studio not found');
    }

    return {
      id: studio.id,
      name: studio.name,
      slug: studio.slug,
      members: studio.members,
    };
  }

  @Patch(':slug')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Studio updated.' })
  async update(
    @CurrentUser() user: { id: string },
    @Param('slug') slug: string,
    @Body() dto: UpdateStudioDto,
  ) {
    return this.studiosService.update(user.id, slug, dto);
  }
}
