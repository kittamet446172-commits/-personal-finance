import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpsertUserSettingsDto {
  @IsString()
  @IsOptional()
  emergencyFundAccountId?: string | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlySalary?: number;
}
