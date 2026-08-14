import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { QueryTransferDto } from './dto/query-transfer.dto';

@Injectable()
export class TransfersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: QueryTransferDto) {
    const page = Number(query.page ?? 1);
    const limit = Math.min(Number(query.limit ?? 20), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.TransferWhereInput = {
      userId,
      ...(query.month || query.year
        ? {
            date: {
              gte: new Date(
                Number(query.year ?? new Date().getFullYear()),
                Number(query.month ?? 1) - 1,
                1,
              ),
              lt: new Date(
                Number(query.year ?? new Date().getFullYear()),
                Number(query.month ?? 12),
                1,
              ),
            },
          }
        : {}),
      ...(query.search && {
        description: { contains: query.search, mode: 'insensitive' },
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.transfer.count({ where }),
      this.prisma.transfer.findMany({
        where,
        include: {
          fromAccount: { select: { id: true, name: true } },
          toAccount: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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
