import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

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
  @MaxLength(100)
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
}
