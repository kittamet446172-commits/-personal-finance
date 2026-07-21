import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDividendDto {
  @IsString()
  holdingId!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  perShare?: number;

  @IsDateString()
  date!: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  note?: string;
}
