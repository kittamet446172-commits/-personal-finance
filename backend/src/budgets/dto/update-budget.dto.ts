import { IsBoolean, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateBudgetDto {
  @IsNumber()
  @IsPositive()
  @IsOptional()
  amount?: number;

  @IsBoolean()
  @IsOptional()
  rollover?: boolean;
}
