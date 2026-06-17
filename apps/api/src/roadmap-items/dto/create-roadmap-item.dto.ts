import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateRoadmapItemDto {
  @ApiProperty({ example: 'Public demo' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'Release a playable demo with the first two biomes.' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ enum: ['PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const })
  @IsOptional()
  @IsEnum(['PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const)
  status?: 'PLANNED' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

  @ApiPropertyOptional({ example: '2027-01-15' })
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  position?: number;
}
