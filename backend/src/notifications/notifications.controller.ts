import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { AuthGuard } from '../auth/guards/auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { AuthenticatedUser } from '../common/types/request.type'

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('vapid-public-key')
  getVapidPublicKey() {
    return this.notificationsService.getVapidPublicKey()
  }

  @Post('subscribe')
  @UseGuards(AuthGuard)
  subscribe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    return this.notificationsService.subscribe(user.id, body)
  }

  @Delete('unsubscribe')
  @UseGuards(AuthGuard)
  unsubscribe(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.unsubscribe(user.id)
  }

  @Post('test-send')
  @UseGuards(AuthGuard)
  testSend() {
    return this.notificationsService.sendDailyReminder()
  }
}
