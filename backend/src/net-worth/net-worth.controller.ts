import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/request.type';
import { NetWorthService } from './net-worth.service';

@Controller('net-worth')
@UseGuards(AuthGuard)
export class NetWorthController {
  constructor(private readonly service: NetWorthService) {}

  @Get('history')
  async getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('months') months = '6',
  ) {
    return this.service.getHistory(user.id, Number(months));
  }

  @Post('snapshot')
  async snapshot(@CurrentUser() user: AuthenticatedUser) {
    await this.service.takeSnapshot(user.id);
    return { ok: true };
  }
}
