import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUrl, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateDevlogDto {
  @ApiProperty({ example: 'Combat prototype update' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'A deep dive into the new combat mechanics' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  subtitle?: string;

  @ApiProperty({ example: 'combat-prototype-update' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase, URL-safe, and hyphen-separated',
  })
  slug!: string;

  @ApiProperty({ example: 'Long markdown body...' })
  @IsString()
  @MinLength(1)
  @MaxLength(100000)
  body!: string;

  @ApiPropertyOptional({ example: 'https://example.com/devlog-cover.jpg' })
  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: false })
  coverUrl?: string;

  @ApiPropertyOptional({ example: 'DRAFT' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiPropertyOptional({ example: '2026-12-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  readingTimeMin?: number;

  @ApiPropertyOptional({ example: 'Combat' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: ['update', 'combat', 'prototype'] })
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  screenshots?: { url: string; order: number; caption?: string }[];
}
