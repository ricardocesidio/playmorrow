import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'dev@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[^a-zA-Z0-9]).{8,}$/, { message: 'Password must be at least 8 characters and include at least one special character.' })
  password!: string;

  @ApiProperty()
  @IsBoolean()
  acceptedTerms!: boolean;

  @ApiProperty()
  @IsBoolean()
  acceptedPrivacy!: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  partnerMarketingOptIn?: boolean;
}
