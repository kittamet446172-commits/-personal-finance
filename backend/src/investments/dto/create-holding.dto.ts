import { InvestmentType } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateHoldingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  symbol!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsEnum(InvestmentType)
  type!: InvestmentType;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  exchange?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  sector?: string;

  @IsString()
  @MaxLength(10)
  @IsOptional()
  currency?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  currentPrice?: number;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  note?: string;
}
