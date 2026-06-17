import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class ReactDto {
  @ApiProperty({ enum: ['LIKE', 'LOVE', 'HYPE', 'INSIGHTFUL'] })
  @IsIn(['LIKE', 'LOVE', 'HYPE', 'INSIGHTFUL'] as const)
  type!: 'LIKE' | 'LOVE' | 'HYPE' | 'INSIGHTFUL';
}
