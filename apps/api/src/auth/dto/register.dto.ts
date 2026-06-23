import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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
  @MaxLength(30)
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
  password!: string;

  @ApiProperty({ enum: RegisterAccountType, required: false, default: 'PLAYER' })
  @IsOptional()
  @IsEnum(RegisterAccountType)
  accountType?: RegisterAccountType;
}
