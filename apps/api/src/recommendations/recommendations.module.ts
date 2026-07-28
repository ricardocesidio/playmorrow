import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { TagSimilarityScorer } from './scorers/tag-similarity.scorer';
import { FollowBasedScorer } from './scorers/follow-based.scorer';
import { TrendingScorer } from './scorers/trending.scorer';
import { WishlistSimilarityScorer } from './scorers/wishlist-similarity.scorer';
import { InteractionHistoryScorer } from './scorers/interaction-history.scorer';
import { InMemoryCacheProvider } from './in-memory-cache';

@Module({
  imports: [PrismaModule],
  controllers: [RecommendationsController],
  providers: [
    RecommendationsService,
    TagSimilarityScorer,
    FollowBasedScorer,
    TrendingScorer,
    WishlistSimilarityScorer,
    InteractionHistoryScorer,
    InMemoryCacheProvider,
  ],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
