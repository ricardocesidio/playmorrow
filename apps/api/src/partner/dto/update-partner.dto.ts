import { IsString, IsOptional, IsUrl, IsEmail } from 'class-validator';

export class UpdatePartnerDto {
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUrl() websiteUrl?: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsEmail() contactEmail?: string;
  @IsOptional() @IsString() status?: string;
}
