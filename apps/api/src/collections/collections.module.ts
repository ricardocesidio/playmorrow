import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CollectionsController } from './collections.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CollectionsController],
})
export class CollectionsModule {}
