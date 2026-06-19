import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { ReportReason } from '@playmorrow/database';

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

// Compile-time guard: this list must match the Prisma `ReportReason` enum
// exactly. If the enum and the array drift, this assignment stops compiling.
type AssertExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const _reasonsInSync: AssertExact<(typeof VALID_REPORT_REASONS)[number], ReportReason> = true;
void _reasonsInSync;

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
  reason!: ReportReason;

  @ApiPropertyOptional({ example: 'Optional human explanation' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  details?: string;
}
