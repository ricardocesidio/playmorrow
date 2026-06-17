import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsObject, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class UpsertPressKitDto {
  @ApiProperty({ example: 'A hand-painted exploration game about forgotten underwater ruins.' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  headline!: string;

  @ApiPropertyOptional({ example: { developer: 'Moonlit Forge', releaseDate: 'Q4 2026', platforms: ['PC'], price: '$19.99', engine: 'Godot' } })
  @IsOptional()
  @IsObject()
  factSheet?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'press@moonlitforge.com' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ example: 'https://drive.google.com/example' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  downloadUrl?: string;
}
