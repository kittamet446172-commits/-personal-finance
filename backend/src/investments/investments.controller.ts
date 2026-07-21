import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/request.type';
import { CreateHoldingDto } from './dto/create-holding.dto';
import { UpdateHoldingDto } from './dto/update-holding.dto';
import { CreateInvestmentTransactionDto } from './dto/create-investment-transaction.dto';

@Controller('investments')
@UseGuards(AuthGuard)
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  // ─── Portfolio ──────────────────────────────────────────────────────────────

  @Get('portfolio')
  getPortfolio(@CurrentUser() user: AuthenticatedUser) {
    return this.investmentsService.getPortfolio(user.id);
  }

  // ─── Holdings ───────────────────────────────────────────────────────────────

  @Get('holdings')
  findAllHoldings(@CurrentUser() user: AuthenticatedUser) {
    return this.investmentsService.findAllHoldings(user.id);
  }

  @Get('holdings/:id')
  findOneHolding(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.investmentsService.findOneHolding(id, user.id);
  }

  @Post('holdings')
  createHolding(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHoldingDto,
  ) {
    return this.investmentsService.createHolding(user.id, dto);
  }

  @Patch('holdings/:id')
  updateHolding(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateHoldingDto,
  ) {
    return this.investmentsService.updateHolding(id, user.id, dto);
  }

  @Post('holdings/refresh-all')
  refreshAllPrices(@CurrentUser() user: AuthenticatedUser) {
    return this.investmentsService.refreshAllPrices(user.id);
  }

  @Post('holdings/:id/refresh-price')
  refreshPrice(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.investmentsService.refreshPrice(id, user.id);
  }

  @Delete('holdings/:id')
  deleteHolding(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.investmentsService.deleteHolding(id, user.id);
  }

  // ─── Transactions ────────────────────────────────────────────────────────────

  @Get('holdings/:holdingId/transactions')
  findTransactions(
    @Param('holdingId') holdingId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.investmentsService.findTransactions(holdingId, user.id);
  }

  @Post('holdings/:holdingId/transactions')
  createTransaction(
    @Param('holdingId') holdingId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInvestmentTransactionDto,
  ) {
    return this.investmentsService.createTransaction(holdingId, user.id, dto);
  }

  @Delete('transactions/:id')
  deleteTransaction(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.investmentsService.deleteTransaction(id, user.id);
  }
}
