import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class UpdateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(10)
  @IsOptional()
  icon?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  color?: string;

  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;
}
