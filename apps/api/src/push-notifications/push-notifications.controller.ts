import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PushNotificationsService } from './push-notifications.service';

@ApiTags('Push Notifications')
@Controller('me/push-subscriptions')
export class PushNotificationsController {
  constructor(private pushService: PushNotificationsService) {}

  @Post()
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Subscribed to push notifications.' })
  async subscribe(
    @Body() body: { endpoint: string; p256dh: string; auth: string },
    @CurrentUser() user: { id: string },
  ) {
    await this.pushService.subscribe(user.id, body.endpoint, body.p256dh, body.auth);
    return { ok: true };
  }

  @Delete()
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Unsubscribed from push notifications.' })
  async unsubscribe(
    @Body() body: { endpoint: string },
    @CurrentUser() user: { id: string },
  ) {
    await this.pushService.unsubscribe(user.id, body.endpoint);
    return { ok: true };
  }
}
