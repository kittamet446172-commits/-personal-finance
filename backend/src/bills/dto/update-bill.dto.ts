import { IsBoolean, IsInt, IsNumber, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';

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

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  note?: string;
}
