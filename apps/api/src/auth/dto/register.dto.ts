import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export enum RegisterAccountType {
  PLAYER = 'PLAYER',
  STUDIO = 'STUDIO',
}

export class RegisterDto {
  @ApiProperty({ example: 'dev@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'devname' })
  @IsString()
  @MinLength(3)
  @MaxLength(12)
  @Matches(/^[a-zA-Z0-9]+$/, { message: 'Username can only contain letters and numbers and must be at most 12 characters.' })
  username!: string;

  @ApiProperty({ example: 'Dev Name' })
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9\s]+$/, { message: 'Name can only contain letters, numbers, and spaces (max 30 characters).' })
  displayName!: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[^a-zA-Z0-9]).{8,}$/, { message: 'Password must be at least 8 characters and include at least one special character.' })
  password!: string;

  @ApiProperty({ enum: RegisterAccountType, required: false, default: 'PLAYER' })
  @IsOptional()
  @IsEnum(RegisterAccountType)
  accountType?: RegisterAccountType;

  @ApiProperty()
  @IsBoolean()
  acceptedTerms!: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  partnerMarketingOptIn?: boolean;
}
