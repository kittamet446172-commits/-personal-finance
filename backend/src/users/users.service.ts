import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
  createdAt: true,
  emergencyFundGoal: true,
  emergencyFundAccountId: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
  }

  async updateProfile(id: string, dto: UpdateUserDto) {
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.emergencyFundGoal !== undefined) data.emergencyFundGoal = dto.emergencyFundGoal;
    if ('emergencyFundAccountId' in dto) data.emergencyFundAccountId = dto.emergencyFundAccountId;

    return this.prisma.user.update({
      where: { id },
      data,
      select: { ...USER_SELECT, updatedAt: true },
    });
  }

  async updateAvatar(id: string, imageUrl: string) {
    return this.prisma.user.update({
      where: { id },
      data: { image: imageUrl },
      select: { ...USER_SELECT, updatedAt: true },
    });
  }
}
