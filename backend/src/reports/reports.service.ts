import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMonthlySummary(userId: string, month: number, year: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const transactions = await this.prisma.transaction.findMany({
      where: { userId, date: { gte: start, lt: end } },
      select: { type: true, amount: true },
    });

    let income = 0;
    let expense = 0;

    for (const t of transactions) {
      if (t.type === TransactionType.INCOME) income += Number(t.amount);
      else expense += Number(t.amount);
    }

    return {
      month,
      year,
      income,
      expense,
      savings: income - expense,
      savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0,
    };
  }

  async getCategoryBreakdown(
    userId: string,
    month: number,
    year: number,
    type: TransactionType,
  ) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const rows = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type, date: { gte: start, lt: end } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    if (rows.length === 0) return [];

    const categories = await this.prisma.category.findMany({
      where: { id: { in: rows.map((r) => r.categoryId) } },
      select: { id: true, name: true, icon: true, color: true },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const total = rows.reduce((sum, r) => sum + Number(r._sum.amount ?? 0), 0);

    return rows.map((r) => ({
      category: categoryMap.get(r.categoryId),
      amount: Number(r._sum.amount ?? 0),
      percentage: total > 0 ? (Number(r._sum.amount ?? 0) / total) * 100 : 0,
    }));
  }

  async getDailyBreakdown(
    userId: string,
    month: number,
    year: number,
    type: TransactionType,
  ) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const transactions = await this.prisma.transaction.findMany({
      where: { userId, type, date: { gte: start, lt: end } },
      select: {
        amount: true,
        date: true,
        categoryId: true,
        category: { select: { id: true, name: true, icon: true, color: true } },
      },
      orderBy: { date: 'asc' },
    });

    type CatEntry = {
      category: { id: string; name: string; icon: string | null; color: string | null } | null;
      amount: number;
    };

    const dayMap = new Map<number, Map<string, CatEntry>>();

    for (const t of transactions) {
      const day = t.date.getDate();
      if (!dayMap.has(day)) dayMap.set(day, new Map());
      const catMap = dayMap.get(day)!;
      const key = t.categoryId ?? '__none__';
      if (!catMap.has(key)) catMap.set(key, { category: t.category, amount: 0 });
      catMap.get(key)!.amount += Number(t.amount);
    }

    const days: Array<{
      day: number;
      total: number;
      categories: Array<{
        category: CatEntry['category'];
        amount: number;
        percentage: number;
      }>;
    }> = [];

    for (const [day, catMap] of dayMap.entries()) {
      const cats = [...catMap.values()].sort((a, b) => b.amount - a.amount);
      const total = cats.reduce((sum, c) => sum + c.amount, 0);
      days.push({
        day,
        total,
        categories: cats.map((c) => ({
          category: c.category,
          amount: c.amount,
          percentage: total > 0 ? (c.amount / total) * 100 : 0,
        })),
      });
    }

    return days.sort((a, b) => a.day - b.day);
  }

  async getYearlyTrend(userId: string, year: number) {
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    const transactions = await this.prisma.transaction.findMany({
      where: { userId, date: { gte: start, lt: end } },
      select: { type: true, amount: true, date: true },
    });

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0,
      savings: 0,
    }));

    for (const t of transactions) {
      const m = t.date.getMonth();
      if (t.type === TransactionType.INCOME) months[m].income += Number(t.amount);
      else months[m].expense += Number(t.amount);
    }

    for (const m of months) {
      m.savings = m.income - m.expense;
    }

    return { year, months };
  }
}
