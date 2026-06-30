import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { StudioRole } from '@playmorrow/database';

export class CreateInvitationDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsEnum(StudioRole)
  role!: StudioRole;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
