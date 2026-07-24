import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SupportDepartment, SupportTicketPriority } from '@playmorrow/database';

export class CreateTicketDto {
  @ApiProperty({ example: 'Cannot log into my account' })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'I have been trying to log in for the past hour but keep getting an error...' })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  body!: string;

  @ApiPropertyOptional({ enum: SupportDepartment, default: SupportDepartment.GENERAL })
  @IsOptional()
  @IsEnum(SupportDepartment)
  department?: SupportDepartment;

  @ApiPropertyOptional({ enum: SupportTicketPriority, default: SupportTicketPriority.MEDIUM })
  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;
}
