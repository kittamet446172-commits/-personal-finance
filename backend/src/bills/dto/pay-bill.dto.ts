import { IsDateString, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class PayBillDto {
  @IsString()
  accountId!: string;

  @IsString()
  categoryId!: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  amount?: number;

  @IsDateString()
  @IsOptional()
  date?: string;
}
