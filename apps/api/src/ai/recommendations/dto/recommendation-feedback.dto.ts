import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum FeedbackActionDto {
  CLICKED = 'CLICKED',
  DISMISSED = 'DISMISSED',
  WISHLISTED = 'WISHLISTED',
}

export class RecommendationFeedbackDto {
  @ApiProperty({ example: 'clx9abc123', description: 'Game the user acted on' })
  @IsString()
  @IsNotEmpty()
  gameId!: string;

  @ApiProperty({ enum: FeedbackActionDto, example: FeedbackActionDto.CLICKED })
  @IsEnum(FeedbackActionDto)
  action!: FeedbackActionDto;
}
