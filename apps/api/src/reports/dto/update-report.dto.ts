import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateReportDto {
  @ApiProperty({ enum: ['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'] })
  @IsIn(['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'] as const)
  status!: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';

  @ApiPropertyOptional({ example: 'Confirmed spam; content removed.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolutionNote?: string;
}
