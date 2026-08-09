import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { EventBusModule } from '../common/event-bus.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { AIController } from './controllers/ai.controller';
import { RecommendationController } from './controllers/recommendation.controller';
import { ForYouController } from './recommendations/for-you.controller';
import { AIService } from './services/ai.service';
import { RecommendationService } from './services/recommendation.service';
import { AIConfig } from './config/ai.config';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { ProviderFactory } from './providers/provider.factory';
import { PgVectorStore } from './rag/vector-store.pgvector';
import { EmbeddingService } from './rag/embedding.service';
import { TextChunker } from './rag/chunker';
import { PromptRegistry } from './prompts/prompt.registry';
import { ConversationMemory } from './memory/conversation.memory';
import { StreamService } from './streaming/stream.service';
import { AIMetricsService } from './observability/ai-metrics.service';
import { GameEmbeddingRepository } from './recommendations/game-embedding.repository';
import { TasteSignalService } from './recommendations/taste-signal.service';
import { HybridRecommenderService } from './recommendations/hybrid-recommender.service';
import { RecommendationFeedbackService } from './recommendations/recommendation-feedback.service';
import { GameEmbeddingRefreshService } from './recommendations/game-embedding-refresh.service';

@Global()
@Module({
  imports: [ConfigModule, PrismaModule, EventBusModule, RecommendationsModule],
  controllers: [AIController, RecommendationController, ForYouController],
  providers: [
    AIConfig,
    OpenAIProvider,
    AnthropicProvider,
    ProviderFactory,
    AIService,
    PgVectorStore,
    EmbeddingService,
    TextChunker,
    PromptRegistry,
    ConversationMemory,
    StreamService,
    AIMetricsService,
    RecommendationService,
    GameEmbeddingRepository,
    TasteSignalService,
    HybridRecommenderService,
    RecommendationFeedbackService,
    GameEmbeddingRefreshService,
  ],
  exports: [
    ProviderFactory,
    AIService,
    AIConfig,
    PgVectorStore,
    EmbeddingService,
    TextChunker,
    PromptRegistry,
    ConversationMemory,
    StreamService,
    AIMetricsService,
    RecommendationService,
    GameEmbeddingRepository,
    TasteSignalService,
    HybridRecommenderService,
    RecommendationFeedbackService,
    GameEmbeddingRefreshService,
  ],
})
export class AIModule {}
