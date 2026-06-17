import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DevlogsModule } from './devlogs/devlogs.module';
import { FeedModule } from './feed/feed.module';
import { FollowsModule } from './follows/follows.module';
import { GamesModule } from './games/games.module';
import { PressKitsModule } from './press-kits/press-kits.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { RoadmapItemsModule } from './roadmap-items/roadmap-items.module';
import { StudiosModule } from './studios/studios.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'apps/api/.env'],
    }),
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    StudiosModule,
    GamesModule,
    DevlogsModule,
    RoadmapItemsModule,
    FollowsModule,
    FeedModule,
    PressKitsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
