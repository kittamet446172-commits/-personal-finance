import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExchangeRateService } from './exchange-rate.service';
import { CreateHoldingDto } from './dto/create-holding.dto';
import { UpdateHoldingDto } from './dto/update-holding.dto';
import { CreateInvestmentTransactionDto } from './dto/create-investment-transaction.dto';

@Injectable()
export class InvestmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exchangeRate: ExchangeRateService,
  ) {}

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
      include: { transactions: { orderBy: { date: 'desc' } }, dividends: { orderBy: { date: 'desc' } } },
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

    const currencies = [...new Set(holdings.map((h) => h.currency).filter((c) => c !== 'THB'))];
    const rates: Record<string, number> = { THB: 1 };
    await Promise.all(
      currencies.map(async (currency) => {
        rates[currency] = await this.exchangeRate.getRate(currency, 'THB');
      }),
    );

    const items = holdings.map((h) => this.calcHolding(h, rates[h.currency] ?? 1));
    const totalCurrentValue = items.reduce((s, i) => s + i.currentValue, 0);
    const totalCostBasis = items.reduce((s, i) => s + i.costBasis, 0);
    const totalDividends = items.reduce((s, i) => s + i.totalDividends, 0);
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

  private calcHolding(h: {
    id: string;
    symbol: string;
    name: string;
    type: string;
    exchange: string | null;
    sector: string | null;
    currency: string;
    currentPrice: { toNumber: () => number };
    priceUpdatedAt: Date | null;
    note: string | null;
    transactions: {
      type: string;
      quantity: { toNumber: () => number };
      pricePerUnit: { toNumber: () => number };
      fee: { toNumber: () => number };
    }[];
    dividends: { amount: { toNumber: () => number } }[];
  }, exchangeRate = 1) {
    const buys = h.transactions.filter((t) => t.type === 'BUY');
    const sells = h.transactions.filter((t) => t.type === 'SELL');

    const totalBuyQty = buys.reduce((s, t) => s + t.quantity.toNumber(), 0);
    const totalSellQty = sells.reduce((s, t) => s + t.quantity.toNumber(), 0);
    const totalQty = totalBuyQty - totalSellQty;

    const totalBuyCost = buys.reduce(
      (s, t) => s + t.quantity.toNumber() * t.pricePerUnit.toNumber() + t.fee.toNumber(),
      0,
    );
    const avgCost = totalBuyQty > 0 ? totalBuyCost / totalBuyQty : 0;
    const costBasis = avgCost * totalQty;

    const currentPrice = h.currentPrice.toNumber();
    const currentValue = totalQty * currentPrice * exchangeRate;
    const costBasisTHB = costBasis * exchangeRate;
    const unrealizedGain = currentValue - costBasisTHB;

    const totalDividends = h.dividends.reduce((s, d) => s + d.amount.toNumber(), 0);

    return {
      id: h.id,
      symbol: h.symbol,
      name: h.name,
      type: h.type,
      exchange: h.exchange,
      sector: h.sector,
      currency: h.currency,
      currentPrice,
      priceUpdatedAt: h.priceUpdatedAt,
      exchangeRate,
      note: h.note,
      totalQty,
      avgCost,
      costBasis: costBasisTHB,
      currentValue,
      unrealizedGain,
      unrealizedGainPct: costBasisTHB > 0 ? (unrealizedGain / costBasisTHB) * 100 : 0,
      totalDividends,
    };
  }

  private async getTotalQuantity(holdingId: string, userId: string) {
    const txs = await this.prisma.investmentTransaction.findMany({
      where: { holdingId, userId },
    });
    return txs.reduce((s, t) => {
      const qty = (t.quantity as unknown as { toNumber: () => number }).toNumber();
      return t.type === 'BUY' ? s + qty : s - qty;
    }, 0);
  }
}
