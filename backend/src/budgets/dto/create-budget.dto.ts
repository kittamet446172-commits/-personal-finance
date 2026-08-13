import {
  IsInt,
  IsNumber,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateBudgetDto {
  @IsString()
  categoryId!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;
}
