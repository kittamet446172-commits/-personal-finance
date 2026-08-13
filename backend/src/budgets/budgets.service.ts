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

    // Compute rollover amounts for budgets that have rollover enabled
    const rolloverBudgets = budgets.filter((b) => b.rollover);
    const rolledAmountMap = new Map<string, number>();

    if (rolloverBudgets.length > 0) {
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prevStart = new Date(prevYear, prevMonth - 1, 1);
      const prevEnd = new Date(prevYear, prevMonth, 1);

      const prevBudgets = await this.prisma.budget.findMany({
        where: {
          userId,
          month: prevMonth,
          year: prevYear,
          categoryId: { in: rolloverBudgets.map((b) => b.categoryId) },
        },
      });

      if (prevBudgets.length > 0) {
        const prevSpending = await this.prisma.transaction.groupBy({
          by: ['categoryId'],
          where: {
            userId,
            type: TransactionType.EXPENSE,
            date: { gte: prevStart, lt: prevEnd },
            categoryId: { in: prevBudgets.map((b) => b.categoryId) },
          },
          _sum: { amount: true },
        });

        const prevSpentMap = new Map(
          prevSpending.map((s) => [s.categoryId, Number(s._sum.amount ?? 0)]),
        );

        for (const pb of prevBudgets) {
          const prevRemaining =
            Number(pb.amount) - (prevSpentMap.get(pb.categoryId) ?? 0);
          if (prevRemaining > 0) {
            rolledAmountMap.set(pb.categoryId, prevRemaining);
          }
        }
      }
    }

    return budgets.map((b) => {
      const spent = spentMap.get(b.categoryId) ?? 0;
      const rolledAmount = rolledAmountMap.get(b.categoryId) ?? 0;
      const effectiveAmount = Number(b.amount) + rolledAmount;
      return {
        ...b,
        spent,
        rolledAmount,
        remaining: effectiveAmount - spent,
      };
    });
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
        rollover: dto.rollover ?? false,
      },
      include: { category: true },
    });
  }

  async update(id: string, userId: string, dto: UpdateBudgetDto) {
    await this.findOne(id, userId);
    return this.prisma.budget.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.rollover !== undefined && { rollover: dto.rollover }),
      },
      include: { category: true },
    });
  }

  async delete(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.budget.delete({ where: { id } });
  }
}
