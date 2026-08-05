import { IsString, IsInt, IsOptional, IsArray, Min } from 'class-validator';

export class CreateListingDto {
  @IsString() studioId!: string;
  @IsString() type!: string;
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsInt() @Min(1) priceCents!: number;
  @IsOptional() @IsString() fileUrl?: string;
  @IsOptional() @IsString() thumbnailUrl?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() gameId?: string;
}
