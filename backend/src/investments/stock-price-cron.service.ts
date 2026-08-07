import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { StockPriceService } from './stock-price.service';

@Injectable()
export class StockPriceCronService {
  private readonly logger = new Logger(StockPriceCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stockPrice: StockPriceService,
  ) {}

  // ช่วงตลาด US เปิด (เวลาไทย): 20:30–03:00 → Cron 2 ตัว
  // จ-ศ 20:00-23:30 ทุก 30 นาที
  @Cron('0,30 20-23 * * 1-5', { timeZone: 'Asia/Bangkok' })
  async refreshEveningSession() {
    await this.refreshAllPrices();
  }

  // อ-ส 00:00-03:00 ทุก 30 นาที
  @Cron('0,30 0-3 * * 2-6', { timeZone: 'Asia/Bangkok' })
  async refreshNightSession() {
    await this.refreshAllPrices();
  }

  async refreshAllPrices(): Promise<{ updated: number; failed: number }> {
    const holdings = await this.prisma.investmentHolding.findMany({
      select: { id: true, symbol: true },
    });

    let updated = 0;
    let failed = 0;

    await Promise.all(
      holdings.map(async (h) => {
        const price = await this.stockPrice.getPrice(h.symbol);
        if (price !== null) {
          await this.prisma.investmentHolding.update({
            where: { id: h.id },
            data: { currentPrice: price, priceUpdatedAt: new Date() },
          });
          updated++;
        } else {
          failed++;
        }
      }),
    );

    this.logger.log(`Price refresh: ${updated} updated, ${failed} failed`);
    return { updated, failed };
  }
}
