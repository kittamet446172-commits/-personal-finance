import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvestmentHolding, InvestmentTransaction, Dividend } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHoldingDto } from './dto/create-holding.dto';
import { UpdateHoldingDto } from './dto/update-holding.dto';
import { CreateInvestmentTransactionDto } from './dto/create-investment-transaction.dto';
import yahooFinance from 'yahoo-finance2';

type HoldingWithRelations = InvestmentHolding & {
  transactions: InvestmentTransaction[];
  dividends: Dividend[];
};

@Injectable()
export class InvestmentsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Holdings ──────────────────────────────────────────────────────────────

  async findAllHoldings(userId: string) {
    return this.prisma.investmentHolding.findMany({
      where: { userId },
      include: { transactions: true, dividends: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOneHolding(id: string, userId: string) {
    const holding = await this.prisma.investmentHolding.findUnique({
      where: { id },
      include: {
        transactions: { orderBy: { date: 'desc' } },
        dividends: { orderBy: { date: 'desc' } },
      },
    });
    if (!holding) throw new NotFoundException('Holding not found');
    if (holding.userId !== userId) throw new ForbiddenException();
    return holding;
  }

  async createHolding(userId: string, dto: CreateHoldingDto) {
    return this.prisma.investmentHolding.create({
      data: {
        userId,
        symbol: dto.symbol.toUpperCase(),
        name: dto.name,
        type: dto.type,
        exchange: dto.exchange,
        sector: dto.sector,
        currency: dto.currency ?? 'THB',
        currentPrice: dto.currentPrice ?? 0,
        note: dto.note,
      },
    });
  }

  async updateHolding(id: string, userId: string, dto: UpdateHoldingDto) {
    await this.findOneHolding(id, userId);
    return this.prisma.investmentHolding.update({
      where: { id },
      data: {
        ...dto,
        symbol: dto.symbol ? dto.symbol.toUpperCase() : undefined,
      },
    });
  }

  async deleteHolding(id: string, userId: string) {
    await this.findOneHolding(id, userId);
    return this.prisma.investmentHolding.delete({ where: { id } });
  }

  // ─── Transactions ──────────────────────────────────────────────────────────

  async findTransactions(holdingId: string, userId: string) {
    await this.findOneHolding(holdingId, userId);
    return this.prisma.investmentTransaction.findMany({
      where: { holdingId, userId },
      orderBy: { date: 'desc' },
    });
  }

  async createTransaction(
    holdingId: string,
    userId: string,
    dto: CreateInvestmentTransactionDto,
  ) {
    await this.findOneHolding(holdingId, userId);

    if (dto.type === 'SELL') {
      const totalBought = await this.getTotalQuantity(holdingId, userId);
      if (dto.quantity > totalBought) {
        throw new BadRequestException('จำนวนขายมากกว่าจำนวนที่ถือครองอยู่');
      }
    }

    return this.prisma.investmentTransaction.create({
      data: {
        userId,
        holdingId,
        type: dto.type,
        quantity: dto.quantity,
        pricePerUnit: dto.pricePerUnit,
        fee: dto.fee ?? 0,
        date: new Date(dto.date),
        note: dto.note,
      },
    });
  }

  async updateTransaction(
    id: string,
    userId: string,
    dto: import('./dto/update-investment-transaction.dto').UpdateInvestmentTransactionDto,
  ) {
    const tx = await this.prisma.investmentTransaction.findUnique({ where: { id } });
    if (!tx) throw new NotFoundException('Transaction not found');
    if (tx.userId !== userId) throw new ForbiddenException();
    return this.prisma.investmentTransaction.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
    });
  }

  async deleteTransaction(id: string, userId: string) {
    const tx = await this.prisma.investmentTransaction.findUnique({ where: { id } });
    if (!tx) throw new NotFoundException('Transaction not found');
    if (tx.userId !== userId) throw new ForbiddenException();
    return this.prisma.investmentTransaction.delete({ where: { id } });
  }

  // ─── Portfolio ─────────────────────────────────────────────────────────────

  async getPortfolio(userId: string) {
    const holdings = await this.prisma.investmentHolding.findMany({
      where: { userId },
      include: { transactions: true, dividends: true },
    });

    const items = holdings.map((h: HoldingWithRelations) => this.calcHolding(h));
    const totalCurrentValue = items.reduce((s: number, i) => s + i.currentValue, 0);
    const totalCostBasis = items.reduce((s: number, i) => s + i.costBasis, 0);
    const totalDividends = items.reduce((s: number, i) => s + i.totalDividends, 0);
    const unrealizedGain = totalCurrentValue - totalCostBasis;

    return {
      items,
      summary: {
        totalCurrentValue,
        totalCostBasis,
        unrealizedGain,
        unrealizedGainPct: totalCostBasis > 0 ? (unrealizedGain / totalCostBasis) * 100 : 0,
        totalDividends,
      },
    };
  }

  private calcHolding(h: HoldingWithRelations) {
    const buys = h.transactions.filter((t) => t.type === 'BUY');
    const sells = h.transactions.filter((t) => t.type === 'SELL');

    const totalBuyQty = buys.reduce((s: number, t) => s + Number(t.quantity), 0);
    const totalSellQty = sells.reduce((s: number, t) => s + Number(t.quantity), 0);
    const totalQty = totalBuyQty - totalSellQty;

    const totalBuyCost = buys.reduce(
      (s: number, t) => s + Number(t.quantity) * Number(t.pricePerUnit) + Number(t.fee),
      0,
    );
    const avgCost = totalBuyQty > 0 ? totalBuyCost / totalBuyQty : 0;
    const costBasis = avgCost * totalQty;

    const currentPrice = Number(h.currentPrice);
    const currentValue = totalQty * currentPrice;
    const unrealizedGain = currentValue - costBasis;

    const totalDividends = h.dividends.reduce((s: number, d) => s + Number(d.amount), 0);

    return {
      id: h.id,
      symbol: h.symbol,
      name: h.name,
      type: h.type,
      exchange: h.exchange,
      sector: h.sector,
      currency: h.currency,
      currentPrice,
      note: h.note,
      totalQty,
      avgCost,
      costBasis,
      currentValue,
      unrealizedGain,
      unrealizedGainPct: costBasis > 0 ? (unrealizedGain / costBasis) * 100 : 0,
      totalDividends,
    };
  }

  async refreshPrice(id: string, userId: string) {
    const holding = await this.findOneHolding(id, userId);
    const quote = (await yahooFinance.quote(holding.symbol)) as { regularMarketPrice?: number };
    const price = quote.regularMarketPrice;
    if (!price) throw new BadRequestException('ไม่พบราคาหุ้น');
    return this.prisma.investmentHolding.update({
      where: { id },
      data: { currentPrice: price },
    });
  }

  async refreshAllPrices(userId: string) {
    const holdings = await this.prisma.investmentHolding.findMany({
      where: { userId },
    });
    const results = await Promise.allSettled(
      holdings.map(async (h) => {
        const quote = (await yahooFinance.quote(h.symbol)) as { regularMarketPrice?: number };
        const price = quote.regularMarketPrice;
        if (!price) return;
        return this.prisma.investmentHolding.update({
          where: { id: h.id },
          data: { currentPrice: price },
        });
      }),
    );
    const updated = results.filter((r) => r.status === 'fulfilled').length;
    return { updated, total: holdings.length };
  }

  private async getTotalQuantity(holdingId: string, userId: string) {
    const txs = await this.prisma.investmentTransaction.findMany({
      where: { holdingId, userId },
    });
    return txs.reduce((s: number, t) => {
      return t.type === 'BUY' ? s + Number(t.quantity) : s - Number(t.quantity);
    }, 0);
  }
}
