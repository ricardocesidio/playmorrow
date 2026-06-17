import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateStudioDto {
  @ApiProperty({ example: 'Moonlit Forge' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'moonlit-forge' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase, URL-safe, and hyphen-separated',
  })
  slug!: string;

  @ApiPropertyOptional({ example: 'Small indie studio making atmospheric adventure games.' })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  tagline?: string;

  @ApiPropertyOptional({ example: 'A longer description of the studio...' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ example: 'Portugal' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  websiteUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/banner.png' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  bannerUrl?: string;
}
