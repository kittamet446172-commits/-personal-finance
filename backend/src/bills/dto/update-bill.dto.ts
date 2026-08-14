import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';
import { BillFrequency } from './create-bill.dto';

export class UpdateBillDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  amount?: number;

  @IsInt()
  @Min(1)
  @Max(31)
  @IsOptional()
  dueDay?: number;

  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  dueMonth?: number | null;

  @IsEnum(BillFrequency)
  @IsOptional()
  frequency?: BillFrequency;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  note?: string;
}
