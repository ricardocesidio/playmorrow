import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export const VALID_REPORT_REASONS = [
  'SPAM',
  'HARASSMENT',
  'HATE',
  'SEXUAL_CONTENT',
  'VIOLENCE',
  'COPYRIGHT',
  'MISLEADING',
  'OTHER',
] as const;

export class CreateReportDto {
  @ApiProperty({ enum: ['GAME', 'STUDIO', 'DEVLOG', 'COMMENT', 'USER'] })
  @IsIn(['GAME', 'STUDIO', 'DEVLOG', 'COMMENT', 'USER'] as const)
  targetType!: 'GAME' | 'STUDIO' | 'DEVLOG' | 'COMMENT' | 'USER';

  @ApiProperty({ example: 'some-entity-id' })
  @IsString()
  @MinLength(1)
  targetId!: string;

  @ApiProperty({ enum: VALID_REPORT_REASONS })
  @IsIn(VALID_REPORT_REASONS)
  reason!: string;

  @ApiPropertyOptional({ example: 'Optional human explanation' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  details?: string;
}
