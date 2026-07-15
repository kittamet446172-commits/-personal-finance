import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/request.type';
import { CreateTransferDto } from './dto/create-transfer.dto';

@Controller('transfers')
@UseGuards(AuthGuard)
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.transfersService.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTransferDto) {
    return this.transfersService.create(user.id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.transfersService.delete(id, user.id);
  }
}
