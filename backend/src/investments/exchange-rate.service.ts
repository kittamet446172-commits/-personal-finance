import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);
  private readonly cache = new Map<string, { rate: number; expiresAt: number }>();
  private readonly TTL = 60 * 60 * 1000; // 1 hour

  async getRate(from: string, to = 'THB'): Promise<number> {
    if (from === to) return 1;

    const key = `${from}_${to}`;
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiresAt) return cached.rate;

    try {
      const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
      const data = await res.json() as { rates: Record<string, number> };
      const rate = data.rates[to];
      if (!rate) throw new Error(`Rate not found for ${from}→${to}`);
      this.cache.set(key, { rate, expiresAt: Date.now() + this.TTL });
      this.logger.log(`Exchange rate ${from}→${to}: ${rate}`);
      return rate;
    } catch (err) {
      this.logger.error(`Failed to fetch rate ${from}→${to}, using fallback`, err);
      const fallback = from === 'USD' && to === 'THB' ? 34 : 1;
      return fallback;
    }
  }
}
