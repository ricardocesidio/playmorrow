import { PartialType } from '@nestjs/swagger';

import { CreateDevlogDto } from './create-devlog.dto';

export class UpdateDevlogDto extends PartialType(CreateDevlogDto) {}
