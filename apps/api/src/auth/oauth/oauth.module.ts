import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';

import { CsrfService } from '../../common/csrf.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { SessionModule } from '../../session/session.module';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';

@Module({
  imports: [
    PrismaModule,
    SessionModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m') } as JwtSignOptions,
      }),
    }),
  ],
  controllers: [OAuthController],
  providers: [OAuthService, GoogleStrategy, GithubStrategy, CsrfService],
})
export class OAuthModule {}
