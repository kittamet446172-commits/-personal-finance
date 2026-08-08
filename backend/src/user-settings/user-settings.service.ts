import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertUserSettingsDto } from './dto/upsert-user-settings.dto';

@Injectable()
export class UserSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string) {
    return this.prisma.userSettings.findUnique({ where: { userId } });
  }

  async upsert(userId: string, dto: UpsertUserSettingsDto) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        emergencyFundAccountId: dto.emergencyFundAccountId ?? null,
        monthlySalary: dto.monthlySalary ?? null,
      },
      update: {
        emergencyFundAccountId: dto.emergencyFundAccountId ?? null,
        monthlySalary: dto.monthlySalary,
      },
    });
  }
}
