import type { JwtModuleOptions } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { SessionModule } from '../session/session.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OAuthModule } from './oauth/oauth.module';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { OptionalSessionGuard } from './guards/optional-session.guard';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    SessionModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    OAuthModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN', '15m');
        return {
          secret: configService.getOrThrow<string>('JWT_SECRET'),
          signOptions: { expiresIn } as JwtModuleOptions['signOptions'],
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard, SessionAuthGuard, OptionalSessionGuard],
  exports: [JwtModule, JwtStrategy, RolesGuard, SessionAuthGuard, OptionalSessionGuard],
})
export class AuthModule {}
