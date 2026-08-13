import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { InvestmentsService } from '../investments/investments.service';

@Injectable()
export class NetWorthService {
  private readonly logger = new Logger(NetWorthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly investments: InvestmentsService,
  ) {}

  async takeSnapshot(userId: string): Promise<void> {
    const accountsResult = await this.prisma.financeAccount.aggregate({
      where: { userId },
      _sum: { balance: true },
    });
    const totalAccounts = Number(accountsResult._sum.balance ?? 0);

    const portfolio = await this.investments.getPortfolio(userId);
    const totalInvestments = portfolio.summary.totalCurrentValue;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.netWorthSnapshot.upsert({
      where: { userId_date: { userId, date: today } },
      create: {
        userId,
        totalAccounts,
        totalInvestments,
        netWorth: totalAccounts + totalInvestments,
        date: today,
      },
      update: {
        totalAccounts,
        totalInvestments,
        netWorth: totalAccounts + totalInvestments,
      },
    });
  }

  async getHistory(userId: string, months: number) {
    const from = new Date();
    from.setMonth(from.getMonth() - months);
    from.setHours(0, 0, 0, 0);

    return this.prisma.netWorthSnapshot.findMany({
      where: { userId, date: { gte: from } },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        totalAccounts: true,
        totalInvestments: true,
        netWorth: true,
      },
    });
  }

  @Cron('0 1 * * *', { timeZone: 'Asia/Bangkok' })
  async dailySnapshot(): Promise<void> {
    const users = await this.prisma.user.findMany({ select: { id: true } });
    for (const user of users) {
      try {
        await this.takeSnapshot(user.id);
      } catch (e) {
        this.logger.error(`Snapshot failed for user ${user.id}: ${e}`);
      }
    }
    this.logger.log(`Daily net worth snapshot done for ${users.length} users`);
  }
}
