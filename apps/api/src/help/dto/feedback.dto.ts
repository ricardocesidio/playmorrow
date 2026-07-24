import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class FeedbackDto {
  @IsBoolean()
  helpful!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
