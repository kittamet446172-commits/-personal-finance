import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
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

  @IsBoolean()
  @IsOptional()
  rollover?: boolean;
}
