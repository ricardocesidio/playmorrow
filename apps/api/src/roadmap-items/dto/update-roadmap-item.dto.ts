import { PartialType } from '@nestjs/swagger';

import { CreateRoadmapItemDto } from './create-roadmap-item.dto';

export class UpdateRoadmapItemDto extends PartialType(CreateRoadmapItemDto) {}
