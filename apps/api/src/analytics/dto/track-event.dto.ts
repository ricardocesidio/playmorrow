import { IsObject, IsOptional, IsString } from 'class-validator';

export class TrackEventDto {
  @IsString()
  eventType!: string;

  @IsOptional()
  @IsString()
  gameId?: string;

  @IsOptional()
  @IsString()
  studioId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
