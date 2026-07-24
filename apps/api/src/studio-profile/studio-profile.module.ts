import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StudiosModule } from '../studios/studios.module';
import { CompanyProfileController } from './company-profile.controller';
import { CompanyProfileService } from './company-profile.service';

@Module({
  imports: [PrismaModule, AuthModule, StudiosModule],
  controllers: [CompanyProfileController],
  providers: [CompanyProfileService],
  exports: [CompanyProfileService],
})
export class StudioProfileModule {}
