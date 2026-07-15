import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransferDto } from './dto/create-transfer.dto';

@Injectable()
export class TransfersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.transfer.findMany({
      where: { userId },
      include: {
        fromAccount: { select: { id: true, name: true } },
        toAccount: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async create(userId: string, dto: CreateTransferDto) {
    if (dto.fromAccountId === dto.toAccountId) {
      throw new BadRequestException('ไม่สามารถโอนเงินไปยังบัญชีเดิมได้');
    }

    return this.prisma.$transaction(async (p) => {
      const [from, to] = await Promise.all([
        p.financeAccount.findFirst({ where: { id: dto.fromAccountId, userId } }),
        p.financeAccount.findFirst({ where: { id: dto.toAccountId, userId } }),
      ]);

      if (!from || !to) throw new NotFoundException('ไม่พบบัญชี');

      const transfer = await p.transfer.create({
        data: {
          userId,
          fromAccountId: dto.fromAccountId,
          toAccountId: dto.toAccountId,
          amount: dto.amount,
          date: new Date(dto.date),
          description: dto.description,
        },
        include: {
          fromAccount: { select: { id: true, name: true } },
          toAccount: { select: { id: true, name: true } },
        },
      });

      await p.financeAccount.update({
        where: { id: dto.fromAccountId },
        data: { balance: { decrement: dto.amount } },
      });

      await p.financeAccount.update({
        where: { id: dto.toAccountId },
        data: { balance: { increment: dto.amount } },
      });

      return transfer;
    });
  }

  async delete(id: string, userId: string) {
    const transfer = await this.prisma.transfer.findUnique({ where: { id } });
    if (!transfer) throw new NotFoundException('ไม่พบรายการโอน');
    if (transfer.userId !== userId) throw new ForbiddenException();

    return this.prisma.$transaction(async (p) => {
      await p.financeAccount.update({
        where: { id: transfer.fromAccountId },
        data: { balance: { increment: Number(transfer.amount) } },
      });

      await p.financeAccount.update({
        where: { id: transfer.toAccountId },
        data: { balance: { decrement: Number(transfer.amount) } },
      });

      return p.transfer.delete({ where: { id } });
    });
  }
}
