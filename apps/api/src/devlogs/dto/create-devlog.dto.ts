import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString, IsUrl, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateDevlogDto {
  @ApiProperty({ example: 'Combat prototype update' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

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
  @IsUrl({ require_tld: false })
  coverUrl?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}
