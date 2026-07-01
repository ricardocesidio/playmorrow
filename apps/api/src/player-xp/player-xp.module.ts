import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PlayerXpService } from './player-xp.service';

@Module({
  imports: [PrismaModule],
  providers: [PlayerXpService],
  exports: [PlayerXpService],
})
export class PlayerXpModule {}
