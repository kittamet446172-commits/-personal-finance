import { Module } from '@nestjs/common';
import { InvestmentsController } from './investments.controller';
import { InvestmentsService } from './investments.service';
import { ExchangeRateService } from './exchange-rate.service';

@Module({
  controllers: [InvestmentsController],
  providers: [InvestmentsService, ExchangeRateService],
})
export class InvestmentsModule {}
