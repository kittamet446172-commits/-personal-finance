import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class StockPriceService {
  private readonly logger = new Logger(StockPriceService.name);
  private readonly cache = new Map<string, { price: number; expiresAt: number }>();
  private readonly TTL = 15 * 60 * 1000;

  async getPrice(symbol: string): Promise<number | null> {
    const key = symbol.trim().toUpperCase();
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiresAt) return cached.price;

    try {
      const { default: YahooFinanceClass } = await import('yahoo-finance2');
      type YFCtor = new () => { quote: (s: string) => Promise<{ regularMarketPrice?: number }> };
      const yahooFinance = new (YahooFinanceClass as unknown as YFCtor)();
      const quote = await yahooFinance.quote(key);
      const price = quote.regularMarketPrice;
      if (!price) return null;

      this.cache.set(key, { price, expiresAt: Date.now() + this.TTL });
      this.logger.log(`${key}: ${price}`);
      return price;
    } catch (err) {
      this.logger.error(`Failed to fetch price for ${key}`, err);
      return null;
    }
  }

  clearCache(symbol?: string) {
    if (symbol) {
      this.cache.delete(symbol.toUpperCase());
    } else {
      this.cache.clear();
    }
  }
}
