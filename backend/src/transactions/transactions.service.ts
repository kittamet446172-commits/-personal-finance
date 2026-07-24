import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: QueryTransactionDto) {
    const page = Number(query.page ?? 1);
    const limit = Math.min(Number(query.limit ?? 20), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(query.type && { type: query.type }),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.accountId && { accountId: query.accountId }),
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
        OR: [
          { description: { contains: query.search, mode: 'insensitive' } },
          { merchant: { contains: query.search, mode: 'insensitive' } },
          {
            category: { name: { contains: query.search, mode: 'insensitive' } },
          },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.findMany({
        where,
        include: {
          category: true,
          account: { select: { id: true, name: true, type: true } },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, userId: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id },
      include: { category: true, account: true },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    if (tx.userId !== userId) throw new ForbiddenException();
    return tx;
  }

  private async verifyAccountOwnership(accountId: string, userId: string) {
    const account = await this.prisma.financeAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Account not found');
    if (account.userId !== userId) throw new ForbiddenException();
  }

  private async verifyCategoryOwnership(categoryId: string, userId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');
    if (category.userId !== userId) throw new ForbiddenException();
  }

  async create(userId: string, dto: CreateTransactionDto) {
    await this.verifyAccountOwnership(dto.accountId, userId);
    await this.verifyCategoryOwnership(dto.categoryId, userId);

    const tx = await this.prisma.$transaction(async (p) => {
      const created = await p.transaction.create({
        data: {
          userId,
          accountId: dto.accountId,
          categoryId: dto.categoryId,
          type: dto.type,
          amount: dto.amount,
          date: new Date(dto.date),
          description: dto.description,
          merchant: dto.merchant,
        },
        include: { category: true, account: true },
      });

      const balanceDelta =
        dto.type === TransactionType.INCOME ? dto.amount : -dto.amount;

      await p.financeAccount.update({
        where: { id: dto.accountId },
        data: { balance: { increment: balanceDelta } },
      });

      return created;
    });

    return tx;
  }

  async update(id: string, userId: string, dto: UpdateTransactionDto) {
    const existing = await this.findOne(id, userId);

    if (dto.accountId) await this.verifyAccountOwnership(dto.accountId, userId);
    if (dto.categoryId) await this.verifyCategoryOwnership(dto.categoryId, userId);

    return this.prisma.$transaction(async (p) => {
      // Reverse old balance effect
      const oldDelta =
        existing.type === TransactionType.INCOME
          ? -Number(existing.amount)
          : Number(existing.amount);

      await p.financeAccount.update({
        where: { id: existing.accountId },
        data: { balance: { increment: oldDelta } },
      });

      const newAmount = dto.amount ?? Number(existing.amount);
      const newAccountId = dto.accountId ?? existing.accountId;
      const newType = existing.type;

      const newDelta =
        newType === TransactionType.INCOME ? newAmount : -newAmount;

      await p.financeAccount.update({
        where: { id: newAccountId },
        data: { balance: { increment: newDelta } },
      });

      return p.transaction.update({
        where: { id },
        data: {
          ...(dto.amount !== undefined && { amount: dto.amount }),
          ...(dto.date !== undefined && { date: new Date(dto.date) }),
          ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
          ...(dto.accountId !== undefined && { accountId: dto.accountId }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.merchant !== undefined && { merchant: dto.merchant }),
        },
        include: { category: true, account: true },
      });
    });
  }

  async delete(id: string, userId: string) {
    const existing = await this.findOne(id, userId);

    return this.prisma.$transaction(async (p) => {
      const balanceDelta =
        existing.type === TransactionType.INCOME
          ? -Number(existing.amount)
          : Number(existing.amount);

      await p.financeAccount.update({
        where: { id: existing.accountId },
        data: { balance: { increment: balanceDelta } },
      });

      return p.transaction.delete({ where: { id } });
    });
  }

  async getMonthlyStats(userId: string, month: number, year: number) {
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
      income,
      expense,
      savings: income - expense,
      savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0,
    };
  }

  async exportAll(
    userId: string,
    filter: { type?: string; month?: number; year?: number },
  ): Promise<string> {
    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(filter.type && { type: filter.type as TransactionType }),
      ...(filter.month && filter.year
        ? {
            date: {
              gte: new Date(filter.year, filter.month - 1, 1),
              lt: new Date(filter.year, filter.month, 1),
            },
          }
        : {}),
    };

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        category: { select: { name: true } },
        account: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });

    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const header = 'Date,Type,Amount,Category,Account,Description,Merchant';
    const rows = transactions.map((tx) =>
      [
        tx.date.toISOString().split('T')[0],
        tx.type,
        Number(tx.amount).toFixed(2),
        tx.category.name,
        tx.account.name,
        tx.description ?? '',
        tx.merchant ?? '',
      ]
        .map(escape)
        .join(','),
    );

    return [header, ...rows].join('\n');
  }

  async getRecent(userId: string, limit = 10) {
    return this.prisma.transaction.findMany({
      where: { userId },
      include: {
        category: true,
        account: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }
}
