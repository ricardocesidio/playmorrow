import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreatePartnerDto {
  @IsString() type!: string;
  @IsString() name!: string;
  @IsString() slug!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUrl() websiteUrl?: string;
}
