import { IsString, Length } from 'class-validator';

export class EnableTotpDto {
  @IsString()
  @Length(6, 6)
  token!: string;
}

export class VerifyTotpDto {
  @IsString()
  @Length(6, 6)
  token!: string;
}

export class DisableTotpDto {
  @IsString()
  @Length(6, 6)
  token!: string;
}

export class TotpLoginDto {
  @IsString()
  token!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}
