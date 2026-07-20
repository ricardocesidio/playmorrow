import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength, ArrayMaxSize } from 'class-validator';

export enum OnboardingAccountType {
  PLAYER = 'PLAYER',
  STUDIO = 'STUDIO',
}

export class CompleteOnboardingDto {
  @ApiProperty({ enum: OnboardingAccountType, example: OnboardingAccountType.PLAYER })
  @IsEnum(OnboardingAccountType)
  accountType!: OnboardingAccountType;

  @ApiProperty({ example: 'coolgamer42' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' })
  username!: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsString()
  email!: string;

  @ApiPropertyOptional({ example: 'Cool Gamer' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'Indie game developer' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ example: 'US' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ example: 'my-studio' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Studio slug must be lowercase, URL-safe, and hyphen-separated' })
  studioSlug?: string;

  @ApiPropertyOptional({ example: 'My Awesome Studio' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  studioName?: string;

  @ApiPropertyOptional({ example: 'We make awesome games!' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  studioBio?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  studioLogoUrl?: string;

  @ApiPropertyOptional({ example: 'https://mystudio.com' })
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @ApiPropertyOptional({ example: 'San Francisco, CA' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ example: ['studio-one', 'studio-two'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  followStudioSlugs?: string[];

  @ApiPropertyOptional({ example: ['game-one', 'game-two'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  wishlistGameSlugs?: string[];
}