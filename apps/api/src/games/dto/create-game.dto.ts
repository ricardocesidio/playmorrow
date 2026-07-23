import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUrl, Matches, MaxLength, MinLength, ValidateNested } from 'class-validator';

class CreateMediaDto {
  @ApiProperty({ enum: ['SCREENSHOT', 'TRAILER', 'VIDEO', 'LOGO', 'BANNER', 'IMAGE'] as const })
  @IsEnum(['SCREENSHOT', 'TRAILER', 'VIDEO', 'LOGO', 'BANNER', 'IMAGE'] as const)
  type!: 'SCREENSHOT' | 'TRAILER' | 'VIDEO' | 'LOGO' | 'BANNER' | 'IMAGE';

  @ApiProperty({ example: 'https://example.com/screen1.jpg' })
  @IsString()
  url!: string;

  @ApiPropertyOptional({ example: 'Ruins biome' })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

class CreatePlatformLinkDto {
  @ApiProperty({ enum: ['STEAM', 'ITCH', 'EPIC', 'GOG', 'PLAYSTATION', 'XBOX', 'NINTENDO', 'WEB', 'ANDROID', 'IOS', 'DEMO', 'DISCORD', 'WEBSITE', 'OTHER'] as const })
  @IsEnum(['STEAM', 'ITCH', 'EPIC', 'GOG', 'PLAYSTATION', 'XBOX', 'NINTENDO', 'WEB', 'ANDROID', 'IOS', 'DEMO', 'DISCORD', 'WEBSITE', 'OTHER'] as const)
  platform!: 'STEAM' | 'ITCH' | 'EPIC' | 'GOG' | 'PLAYSTATION' | 'XBOX' | 'NINTENDO' | 'WEB' | 'ANDROID' | 'IOS' | 'DEMO' | 'DISCORD' | 'WEBSITE' | 'OTHER';

  @ApiProperty({ example: 'https://store.steampowered.com/app/example' })
  @IsString()
  url!: string;

  @ApiPropertyOptional({ example: 'Wishlist on Steam' })
  @IsOptional()
  @IsString()
  label?: string;
}

export class CreateGameDto {
  @ApiProperty({ example: 'Echoes of the Deep' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'echoes-of-the-deep' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase, URL-safe, and hyphen-separated',
  })
  slug!: string;

  @ApiPropertyOptional({ example: 'A hand-painted exploration game about forgotten underwater ruins.' })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  tagline?: string;

  @ApiPropertyOptional({ example: 'Longer game description...' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @ApiPropertyOptional({ enum: ['CONCEPT', 'IN_DEVELOPMENT', 'ALPHA', 'BETA', 'EARLY_ACCESS', 'RELEASED', 'CANCELLED', 'ON_HOLD'] as const })
  @IsOptional()
  @IsEnum(['CONCEPT', 'IN_DEVELOPMENT', 'ALPHA', 'BETA', 'EARLY_ACCESS', 'RELEASED', 'CANCELLED', 'ON_HOLD'] as const)
  status?: 'CONCEPT' | 'IN_DEVELOPMENT' | 'ALPHA' | 'BETA' | 'EARLY_ACCESS' | 'RELEASED' | 'CANCELLED' | 'ON_HOLD';

  @ApiPropertyOptional({ example: '2027-03-01' })
  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @ApiPropertyOptional({ example: 'Q4 2026' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  expectedReleaseText?: string;

  @ApiPropertyOptional({ example: 1999 })
  @IsOptional()
  @IsInt()
  priceCents?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: false })
  coverUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/banner.png' })
  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: false })
  bannerUrl?: string;

  @ApiPropertyOptional({ example: 'https://www.youtube.com/watch?v=...' })
  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: false })
  trailerUrl?: string;

  @ApiPropertyOptional({ type: [CreatePlatformLinkDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePlatformLinkDto)
  platformLinks?: CreatePlatformLinkDto[];

  @ApiPropertyOptional({ type: [CreateMediaDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMediaDto)
  media?: CreateMediaDto[];

  @ApiPropertyOptional({ example: ['adventure', 'exploration'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
