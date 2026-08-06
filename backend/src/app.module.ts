import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { BudgetsModule } from './budgets/budgets.module';
import { ReportsModule } from './reports/reports.module';
import { TransfersModule } from './transfers/transfers.module';
import { InvestmentsModule } from './investments/investments.module';
import { DividendsModule } from './dividends/dividends.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    BudgetsModule,
    ReportsModule,
    TransfersModule,
    InvestmentsModule,
    DividendsModule,
    HealthModule,
  ],
})
export class AppModule {}
