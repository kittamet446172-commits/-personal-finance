import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';

export enum BillFrequency {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

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

  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  dueMonth?: number;

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
