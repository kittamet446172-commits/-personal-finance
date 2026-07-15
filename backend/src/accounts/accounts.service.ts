import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.financeAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const account = await this.prisma.financeAccount.findUnique({
      where: { id },
    });
    if (!account) throw new NotFoundException('Account not found');
    if (account.userId !== userId) throw new ForbiddenException();
    return account;
  }

  async create(userId: string, dto: CreateAccountDto) {
    return this.prisma.financeAccount.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        balance: dto.balance ?? 0,
        description: dto.description,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateAccountDto) {
    await this.findOne(id, userId);
    return this.prisma.financeAccount.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, userId: string) {
    await this.findOne(id, userId);

    const [txCount, transferCount] = await Promise.all([
      this.prisma.transaction.count({ where: { accountId: id } }),
      this.prisma.transfer.count({
        where: { OR: [{ fromAccountId: id }, { toAccountId: id }] },
      }),
    ]);

    if (txCount > 0 || transferCount > 0) {
      throw new BadRequestException(
        'ไม่สามารถลบบัญชีที่มีรายการธุรกรรมหรือการโอนเงินได้',
      );
    }

    return this.prisma.financeAccount.delete({ where: { id } });
  }

  async getTotalBalance(userId: string) {
    const result = await this.prisma.financeAccount.aggregate({
      where: { userId },
      _sum: { balance: true },
    });
    return result._sum.balance ?? 0;
  }
}
