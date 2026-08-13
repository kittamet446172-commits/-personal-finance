import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, month: number, year: number) {
    const budgets = await this.prisma.budget.findMany({
      where: { userId, month, year },
      include: { category: true },
      orderBy: { category: { name: 'asc' } },
    });

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const spending = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: TransactionType.EXPENSE,
        date: { gte: start, lt: end },
        categoryId: { in: budgets.map((b) => b.categoryId) },
      },
      _sum: { amount: true },
    });

    const spentMap = new Map(
      spending.map((s) => [s.categoryId, Number(s._sum.amount ?? 0)]),
    );

    return budgets.map((b) => ({
      ...b,
      spent: spentMap.get(b.categoryId) ?? 0,
      remaining: Number(b.amount) - (spentMap.get(b.categoryId) ?? 0),
    }));
  }

  async findOne(id: string, userId: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!budget) throw new NotFoundException('Budget not found');
    if (budget.userId !== userId) throw new ForbiddenException();
    return budget;
  }

  async create(userId: string, dto: CreateBudgetDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');
    if (category.userId !== userId) throw new ForbiddenException();

    return this.prisma.budget.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        amount: dto.amount,
        month: dto.month,
        year: dto.year,
      },
      include: { category: true },
    });
  }

  async update(id: string, userId: string, dto: UpdateBudgetDto) {
    await this.findOne(id, userId);
    return this.prisma.budget.update({
      where: { id },
      data: { amount: dto.amount },
      include: { category: true },
    });
  }

  async delete(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.budget.delete({ where: { id } });
  }
}
