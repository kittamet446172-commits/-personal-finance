import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { ReportsService } from './reports.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/request.type';

@Controller('reports')
@UseGuards(AuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly-summary')
  getMonthlySummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const now = new Date();
    return this.reportsService.getMonthlySummary(
      user.id,
      month ? Number(month) : now.getMonth() + 1,
      year ? Number(year) : now.getFullYear(),
    );
  }

  @Get('category-breakdown')
  getCategoryBreakdown(
    @CurrentUser() user: AuthenticatedUser,
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('type') type: TransactionType = TransactionType.EXPENSE,
  ) {
    const now = new Date();
    return this.reportsService.getCategoryBreakdown(
      user.id,
      month ? Number(month) : now.getMonth() + 1,
      year ? Number(year) : now.getFullYear(),
      type,
    );
  }

  @Get('daily-breakdown')
  getDailyBreakdown(
    @CurrentUser() user: AuthenticatedUser,
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('type') type: TransactionType = TransactionType.EXPENSE,
  ) {
    const now = new Date();
    return this.reportsService.getDailyBreakdown(
      user.id,
      month ? Number(month) : now.getMonth() + 1,
      year ? Number(year) : now.getFullYear(),
      type,
    );
  }

  @Get('trend')
  getYearlyTrend(
    @CurrentUser() user: AuthenticatedUser,
    @Query('year') year: string,
  ) {
    return this.reportsService.getYearlyTrend(
      user.id,
      year ? Number(year) : new Date().getFullYear(),
    );
  }
}
