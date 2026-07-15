import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateTransferDto {
  @IsString()
  fromAccountId!: string;

  @IsString()
  toAccountId!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsDateString()
  date!: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;
}
