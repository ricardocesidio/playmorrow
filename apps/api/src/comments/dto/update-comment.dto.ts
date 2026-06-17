import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ example: 'Edited comment text' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body!: string;
}
