import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { OptionalSessionGuard } from './auth/guards/optional-session.guard';
import { CustomThrottlerGuard } from './common/custom-throttler.guard';

import { CsrfGuard } from './common/csrf.guard';
// Removed default Nest scaffolding (AppController / AppService) per 2026-07-09 audit.
// The API is fully prefixed under /api and served by feature modules.
import { CsrfService } from './common/csrf.service';
import { EventBusModule } from './common/event-bus.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
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
import { SupportModule } from './support/support.module';
import { HelpModule } from './help/help.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CspController } from './common/csp.controller';
import { CountersService } from './common/counters.service';
import { ActivityModule } from './activity/activity.module';
import { GoalsModule } from './goals/goals.module';
import { StudioAchievementsModule } from './achievements/studio-achievements.module';
import { StudioHealthModule } from './health/studio-health.module';
import { WeeklyReportsModule } from './reports/weekly-reports.module';
import { VerificationModule } from './verification/verification.module';
import { TrustModule } from './trust/trust.module';
import { StudioProfileModule } from './studio-profile/studio-profile.module';
import { StudioPressKitModule } from './studio-press-kit/studio-press-kit.module';
import { CollectionsModule } from './collections/collections.module';
import { EmailTemplatesModule } from './email-templates/email-templates.module';
import { EmailPreferencesModule } from './email-preferences/email-preferences.module';
import { DigestModule } from './digest/digest.module';
import { DmcaModule } from './dmca/dmca.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { MonitorModule } from './monitor/monitor.module';
import { PaymentsModule } from './payments/payments.module';
import { PublisherModule } from './publisher/publisher.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { ModerationModule } from './moderation/moderation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'apps/api/.env'],
    }),
    // Global rate limiting (#3 from audit): per-user (userId if authenticated) or IP fallback via CustomThrottlerGuard.
    // Per-route @Throttle() for auth etc. still override.
    // `@SkipThrottle()` exempts the health probe.
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
    SupportModule,
    HelpModule,
    AnalyticsModule,
    ActivityModule,
    GoalsModule,
    StudioAchievementsModule,
    StudioHealthModule,
    WeeklyReportsModule,
    EventBusModule,
    RecommendationsModule,
    VerificationModule,
    TrustModule,
    StudioProfileModule,
    StudioPressKitModule,
    CollectionsModule,
    ModerationModule,
    EmailTemplatesModule,
    EmailPreferencesModule,
    DigestModule,
    DmcaModule,
    ApiKeysModule,
    MonitorModule,
    PaymentsModule,
    MarketplaceModule,
    PublisherModule,
  ],
  controllers: [CspController],
  providers: [
    CsrfService,
    CountersService,
    // OptionalSessionGuard first to attach user (if present) before rate limiting
    { provide: APP_GUARD, useClass: OptionalSessionGuard },
    // Custom per-user (or IP fallback) rate limiting
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
})
export class AppModule {}
