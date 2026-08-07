import { LotType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateInvestmentTransactionDto {
  @IsEnum(LotType)
  @IsOptional()
  type?: LotType;

  @IsNumber()
  @Min(0.000001)
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @Min(0.000001)
  @IsOptional()
  pricePerUnit?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  fee?: number;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  note?: string;
}
