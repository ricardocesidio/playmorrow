import { IsString, IsInt, IsOptional, IsArray, Min } from 'class-validator';

export class UpdateListingDto {
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(1) priceCents?: number;
  @IsOptional() @IsString() fileUrl?: string;
  @IsOptional() @IsString() thumbnailUrl?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() gameId?: string;
  @IsOptional() @IsString() status?: string;
}
