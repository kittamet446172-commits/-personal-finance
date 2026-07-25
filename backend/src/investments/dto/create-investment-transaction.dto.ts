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

export class CreateInvestmentTransactionDto {
  @IsEnum(LotType)
  type!: LotType;

  @IsNumber()
  @Min(0.000001)
  quantity!: number;

  @IsNumber()
  @Min(0)
  pricePerUnit!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  fee?: number;

  @IsDateString()
  date!: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  note?: string;
}
