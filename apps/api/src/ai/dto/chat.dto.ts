import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ChatMessageDto {
  @ApiProperty({ example: 'user', enum: ['system', 'user', 'assistant'] })
  @IsString()
  @IsNotEmpty()
  role!: 'system' | 'user' | 'assistant';

  @ApiProperty({ example: 'What games are available on the platform?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100000)
  content!: string;
}

export class ChatRequestDto {
  @ApiProperty({ type: [ChatMessageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[];

  @ApiPropertyOptional({ example: 'gpt-4o-mini' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ example: 4096 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(128000)
  maxTokens?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  stream?: boolean;

  @ApiPropertyOptional({ example: 'game', description: 'Context entity type for RAG' })
  @IsOptional()
  @IsString()
  contextType?: string;

  @ApiPropertyOptional({ example: 'abc123', description: 'Context entity ID for RAG' })
  @IsOptional()
  @IsString()
  contextId?: string;
}

export class EmbedRequestDto {
  @ApiProperty({ example: 'An open-world RPG with crafting mechanics' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  text!: string;

  @ApiPropertyOptional({ example: 'text-embedding-3-small' })
  @IsOptional()
  @IsString()
  model?: string;
}

export class ModerationRequestDto {
  @ApiProperty({ example: 'Some text to moderate' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  text!: string;
}
