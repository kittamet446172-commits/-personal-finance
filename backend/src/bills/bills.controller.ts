import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/request.type';
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';

@Controller('bills')
@UseGuards(AuthGuard)
export class BillsController {
  constructor(private readonly service: BillsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findAll(user.id);
  }

  @Get('upcoming')
  findUpcoming(
    @CurrentUser() user: AuthenticatedUser,
    @Query('days') days = '7',
  ) {
    return this.service.findUpcoming(user.id, Number(days));
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBillDto) {
    return this.service.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBillDto,
  ) {
    return this.service.update(id, user.id, dto);
  }

  @Delete(':id')
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.delete(id, user.id);
  }
}
