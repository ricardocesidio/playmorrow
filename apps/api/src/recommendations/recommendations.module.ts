import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { TagSimilarityScorer } from './scorers/tag-similarity.scorer';
import { FollowBasedScorer } from './scorers/follow-based.scorer';
import { TrendingScorer } from './scorers/trending.scorer';
import { WishlistSimilarityScorer } from './scorers/wishlist-similarity.scorer';
import { InteractionHistoryScorer } from './scorers/interaction-history.scorer';
import { HiddenGemsScorer } from './scorers/hidden-gems.scorer';
import { SimilarStudiosScorer } from './scorers/similar-studios.scorer';
import { RecentlyUpdatedScorer } from './scorers/recently-updated.scorer';
import { LatestReleasesScorer } from './scorers/latest-releases.scorer';
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
    HiddenGemsScorer,
    SimilarStudiosScorer,
    RecentlyUpdatedScorer,
    LatestReleasesScorer,
    InMemoryCacheProvider,
  ],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
