import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { PayBillDto } from './dto/pay-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';

@Injectable()
export class BillsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.bill.findMany({
      where: { userId },
      orderBy: { dueDay: 'asc' },
    });
  }

  async findUpcoming(userId: string, days = 7) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bills = await this.prisma.bill.findMany({
      where: { userId, isActive: true },
    });

    return bills.map((b) => {
      let nextDue: Date;
      if (b.frequency === 'YEARLY' && b.dueMonth) {
        const thisYear = new Date(today.getFullYear(), b.dueMonth - 1, b.dueDay);
        const nextYear = new Date(today.getFullYear() + 1, b.dueMonth - 1, b.dueDay);
        nextDue = thisYear >= today ? thisYear : nextYear;
      } else {
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), b.dueDay);
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, b.dueDay);
        nextDue = thisMonth >= today ? thisMonth : nextMonth;
      }
      const daysLeft = Math.ceil((nextDue.getTime() - today.getTime()) / 86400000);
      return { ...b, nextDue, daysLeft };
    }).filter((b) => b.daysLeft <= days).sort((a, b) => a.daysLeft - b.daysLeft);
  }

  async findOne(id: string, userId: string) {
    const bill = await this.prisma.bill.findUnique({ where: { id } });
    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.userId !== userId) throw new ForbiddenException();
    return bill;
  }

  async create(userId: string, dto: CreateBillDto) {
    return this.prisma.bill.create({
      data: { userId, ...dto, isActive: dto.isActive ?? true },
    });
  }

  async update(id: string, userId: string, dto: UpdateBillDto) {
    await this.findOne(id, userId);
    return this.prisma.bill.update({ where: { id }, data: dto });
  }

  async delete(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.bill.delete({ where: { id } });
  }

  async pay(id: string, userId: string, dto: PayBillDto) {
    const bill = await this.findOne(id, userId);
    const amount = dto.amount ?? Number(bill.amount);
    const date = dto.date ? new Date(dto.date) : new Date();

    return this.prisma.$transaction(async (p) => {
      const tx = await p.transaction.create({
        data: {
          userId,
          accountId: dto.accountId,
          categoryId: dto.categoryId,
          type: TransactionType.EXPENSE,
          amount,
          date,
          description: bill.name,
        },
        include: { category: true, account: true },
      });

      await p.financeAccount.update({
        where: { id: dto.accountId },
        data: { balance: { decrement: amount } },
      });

      return tx;
    });
  }
}
