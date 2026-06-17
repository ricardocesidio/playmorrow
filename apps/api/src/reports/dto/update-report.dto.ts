import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateReportDto {
  @ApiProperty({ enum: ['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'] })
  @IsIn(['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'] as const)
  status!: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
}
