import { IsString, IsOptional, MaxLength, MinLength, Matches, IsEmail } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(12)
  @Matches(/^[a-zA-Z0-9]+$/, { message: 'Username can only contain letters and numbers.' })
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  displayName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;
}
