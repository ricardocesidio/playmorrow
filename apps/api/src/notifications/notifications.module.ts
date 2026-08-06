import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../common/redis.module';
import { NotificationPubSubService } from './notification-pubsub.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Global()
@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationPubSubService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
