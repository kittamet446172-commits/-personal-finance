import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UserSettingsService } from './user-settings.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/request.type';
import { UpsertUserSettingsDto } from './dto/upsert-user-settings.dto';

@Controller('user-settings')
@UseGuards(AuthGuard)
export class UserSettingsController {
  constructor(private readonly service: UserSettingsService) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.service.get(user.id);
  }

  @Patch()
  upsert(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertUserSettingsDto,
  ) {
    return this.service.upsert(user.id, dto);
  }
}
