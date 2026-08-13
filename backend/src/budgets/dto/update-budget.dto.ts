import { IsNumber, IsPositive } from 'class-validator';

export class UpdateBudgetDto {
  @IsNumber()
  @IsPositive()
  amount!: number;
}
