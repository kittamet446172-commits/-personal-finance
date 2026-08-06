import { Module } from '@nestjs/common';
import { InvestmentsController } from './investments.controller';
import { InvestmentsService } from './investments.service';
import { ExchangeRateService } from './exchange-rate.service';
import { StockPriceService } from './stock-price.service';
import { StockPriceCronService } from './stock-price-cron.service';

@Module({
  controllers: [InvestmentsController],
  providers: [InvestmentsService, ExchangeRateService, StockPriceService, StockPriceCronService],
  exports: [StockPriceService, StockPriceCronService],
})
export class InvestmentsModule {}
