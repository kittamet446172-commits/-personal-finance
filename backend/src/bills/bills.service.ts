import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBillDto } from './dto/create-bill.dto';
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
    const todayDay = today.getDate();
    const bills = await this.prisma.bill.findMany({
      where: { userId, isActive: true },
      orderBy: { dueDay: 'asc' },
    });

    return bills.map((b) => {
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), b.dueDay);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, b.dueDay);
      const nextDue = thisMonth >= today ? thisMonth : nextMonth;
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
}
