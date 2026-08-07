import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DividendsService } from './dividends.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/request.type';
import { CreateDividendDto } from './dto/create-dividend.dto';

@Controller('dividends')
@UseGuards(AuthGuard)
export class DividendsController {
  constructor(private readonly dividendsService: DividendsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.dividendsService.findAll(user.id);
  }

  @Get('summary')
  getSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.dividendsService.getSummary(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDividendDto,
  ) {
    return this.dividendsService.create(user.id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.dividendsService.delete(id, user.id);
  }
}
