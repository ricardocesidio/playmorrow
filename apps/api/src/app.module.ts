import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { CsrfGuard } from './common/csrf.guard';
// Removed default Nest scaffolding (AppController / AppService) per 2026-07-09 audit.
// The API is fully prefixed under /api and served by feature modules.
import { CsrfService } from './common/csrf.service';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { CommentsModule } from './comments/comments.module';
import { DevlogsModule } from './devlogs/devlogs.module';
import { ReactionsModule } from './reactions/reactions.module';
import { ReportsModule } from './reports/reports.module';
import { SearchModule } from './search/search.module';
import { InvitationsModule } from './invitations/invitations.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { FeedModule } from './feed/feed.module';
import { FollowsModule } from './follows/follows.module';
import { GamesModule } from './games/games.module';
import { PressKitsModule } from './press-kits/press-kits.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { PrismaModule } from './prisma/prisma.module';
import { RoadmapItemsModule } from './roadmap-items/roadmap-items.module';
import { StudiosModule } from './studios/studios.module';
import { UploadModule } from './upload/upload.module';
import { UsersModule } from './users/users.module';
import { PushNotificationsModule } from './push-notifications/push-notifications.module';
import { AchievementModule } from './achievements/achievement.module';
import { PlayerXpModule } from './player-xp/player-xp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'apps/api/.env'],
    }),
    // Global rate limiting (#3): 60 req/min per IP by default. Per-route
    // `@Throttle()` overrides tighten abuse-prone endpoints (auth, comment/
    // reaction creates); `@SkipThrottle()` exempts the health probe.
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    AuditLogModule,
    HealthModule,
    NotificationsModule,
    UsersModule,
    EmailModule,
    AuthModule,
    StudiosModule,
    UploadModule,
    GamesModule,
    CommentsModule,
    DevlogsModule,
    ReactionsModule,
    ReportsModule,
    RoadmapItemsModule,
    FollowsModule,
    FeedModule,
    PressKitsModule,
    SearchModule,
    WishlistModule,
    InvitationsModule,
    PushNotificationsModule,
    AchievementModule,
    PlayerXpModule,
  ],
  controllers: [],
  providers: [
    CsrfService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
})
export class AppModule {}
