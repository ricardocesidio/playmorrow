import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { EventBusModule } from '../common/event-bus.module';
import { AIController } from './controllers/ai.controller';
import { RecommendationController } from './controllers/recommendation.controller';
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

@Global()
@Module({
  imports: [ConfigModule, PrismaModule, EventBusModule],
  controllers: [AIController, RecommendationController],
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
  ],
})
export class AIModule {}
