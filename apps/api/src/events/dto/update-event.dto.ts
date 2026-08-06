import { IsString, IsOptional, IsBoolean, IsInt, IsDateString } from 'class-validator';

export class UpdateEventDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsBoolean() virtual?: boolean;
  @IsOptional() @IsInt() ticketPriceCents?: number;
  @IsOptional() @IsString() bannerUrl?: string;
  @IsOptional() @IsString() status?: string;
}
