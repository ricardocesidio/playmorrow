import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '../../prisma/prisma.module';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [OAuthController],
  providers: [OAuthService, GoogleStrategy, GithubStrategy],
})
export class OAuthModule {}
