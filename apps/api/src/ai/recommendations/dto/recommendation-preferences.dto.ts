import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsBoolean, IsString } from 'class-validator';

export class UpdatePreferencesDto {
  @ApiProperty({ example: true, description: 'Opt-in consent for personalized recommendations' })
  @IsBoolean()
  personalizationEnabled!: boolean;
}

export class ImpressionsDto {
  @ApiProperty({
    example: ['clx9abc123', 'clx9abc456'],
    description: 'Game ids shown in the For You feed (max 50 per request)',
  })
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  gameIds!: string[];
}
