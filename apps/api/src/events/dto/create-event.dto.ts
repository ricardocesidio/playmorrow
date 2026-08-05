import { IsString, IsOptional, IsBoolean, IsInt, IsDateString } from 'class-validator';

export class CreateEventDto {
  @IsString() title!: string;
  @IsString() slug!: string;
  @IsDateString() startDate!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsBoolean() virtual?: boolean;
  @IsOptional() @IsInt() ticketPriceCents?: number;
  @IsOptional() @IsString() bannerUrl?: string;
}
