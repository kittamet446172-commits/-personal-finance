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

export class UpdateHoldingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  @IsOptional()
  symbol?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @IsEnum(InvestmentType)
  @IsOptional()
  type?: InvestmentType;

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
