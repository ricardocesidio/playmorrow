import { PartialType } from '@nestjs/swagger';

import { CreateStudioDto } from './create-studio.dto';

export class UpdateStudioDto extends PartialType(CreateStudioDto) {}
