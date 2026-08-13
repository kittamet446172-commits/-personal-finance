import { IsBoolean, IsInt, IsNumber, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';

export class CreateBillDto {
  @IsString()
  name!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsInt()
  @Min(1)
  @Max(31)
  dueDay!: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  note?: string;
}
