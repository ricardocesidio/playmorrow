import { Test, TestingModule } from '@nestjs/testing';
import { AIMetricsService } from '../observability/ai-metrics.service';

describe('AIMetricsService', () => {
  let service: AIMetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AIMetricsService],
    }).compile();

    service = module.get(AIMetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should record chat metrics', () => {
    service.recordChat({
      provider: 'openai',
      model: 'gpt-4o-mini',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      latencyMs: 300,
      success: true,
      timestamp: new Date(),
    });

    const metrics = service.getChatMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].provider).toBe('openai');
    expect(metrics[0].model).toBe('gpt-4o-mini');
    expect(metrics[0].totalTokens).toBe(150);
    expect(metrics[0].latencyMs).toBe(300);
  });

  it('should record embedding metrics', () => {
    service.recordEmbedding({
      provider: 'openai',
      model: 'text-embedding-3-small',
      tokens: 42,
      textCount: 3,
      latencyMs: 150,
      success: true,
      timestamp: new Date(),
    });

    const metrics = service.getEmbeddingMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].tokens).toBe(42);
    expect(metrics[0].textCount).toBe(3);
  });

  it('should record moderation metrics', () => {
    service.recordModeration({
      provider: 'openai',
      flagged: true,
      latencyMs: 80,
      success: true,
      timestamp: new Date(),
    });

    const metrics = service.getModerationMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].flagged).toBe(true);
  });

  it('should calculate daily cost', () => {
    service.recordChat({
      provider: 'openai',
      model: 'gpt-4o-mini',
      promptTokens: 1000,
      completionTokens: 1000,
      totalTokens: 2000,
      latencyMs: 200,
      success: true,
      timestamp: new Date(),
    });

    service.recordChat({
      provider: 'openai',
      model: 'gpt-4o',
      promptTokens: 1000,
      completionTokens: 1000,
      totalTokens: 2000,
      latencyMs: 500,
      success: true,
      timestamp: new Date(),
    });

    const dailyCost = service.getDailyCost();
    expect(dailyCost).toBeGreaterThan(0);
    expect(dailyCost).toBeCloseTo(0.01325, 4);
  });

  it('should calculate daily cost with only today metrics', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    service.recordChat({
      provider: 'openai',
      model: 'gpt-4o-mini',
      promptTokens: 10000,
      completionTokens: 5000,
      totalTokens: 15000,
      latencyMs: 200,
      success: true,
      timestamp: yesterday,
    });

    expect(service.getDailyCost()).toBe(0);
  });

  it('should average latency', () => {
    service.recordChat({
      provider: 'openai',
      model: 'gpt-4o-mini',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      latencyMs: 200,
      success: true,
      timestamp: new Date(),
    });

    service.recordChat({
      provider: 'openai',
      model: 'gpt-4o-mini',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      latencyMs: 400,
      success: true,
      timestamp: new Date(),
    });

    expect(service.getAverageLatency()).toBe(300);
  });

  it('should not include failed requests in average latency', () => {
    service.recordChat({
      provider: 'openai',
      model: 'gpt-4o-mini',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      latencyMs: 5000,
      success: false,
      timestamp: new Date(),
    });

    service.recordChat({
      provider: 'openai',
      model: 'gpt-4o-mini',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      latencyMs: 100,
      success: true,
      timestamp: new Date(),
    });

    expect(service.getAverageLatency()).toBe(100);
  });

  it('should return 0 for average latency with no successful metrics', () => {
    expect(service.getAverageLatency()).toBe(0);
  });

  it('should track errors across all metric types', () => {
    service.recordChat({
      provider: 'openai',
      model: 'gpt-4o-mini',
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      latencyMs: 0,
      success: false,
      timestamp: new Date(),
    });

    service.recordEmbedding({
      provider: 'openai',
      model: 'text-embedding-3-small',
      tokens: 0,
      textCount: 0,
      latencyMs: 0,
      success: false,
      timestamp: new Date(),
    });

    service.recordModeration({
      provider: 'openai',
      flagged: false,
      latencyMs: 0,
      success: false,
      timestamp: new Date(),
    });

    expect(service.getErrorCount()).toBe(3);
  });

  it('should estimate costs for OpenAI models', () => {
    const cost = service.estimateCost('gpt-4o', 1000, 500);
    expect(cost).toBe(0.0075);
  });

  it('should estimate costs for Anthropic models', () => {
    const cost = service.estimateCost('claude-3-5-sonnet-20241022', 1000, 500);
    expect(cost).toBeCloseTo(0.0105, 10);
  });

  it('should throw for unknown models', () => {
    expect(() => service.estimateCost('unknown-model', 1000, 500)).toThrow('Unknown model "unknown-model"');
  });

  it('should reset all metrics', () => {
    service.recordChat({
      provider: 'openai',
      model: 'gpt-4o-mini',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      latencyMs: 200,
      success: true,
      timestamp: new Date(),
    });

    service.reset();

    expect(service.getChatMetrics()).toHaveLength(0);
    expect(service.getEmbeddingMetrics()).toHaveLength(0);
    expect(service.getModerationMetrics()).toHaveLength(0);
  });

  it('should assign default timestamp when not provided', () => {
    service.recordChat({
      provider: 'openai',
      model: 'gpt-4o-mini',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      latencyMs: 200,
      success: true,
      timestamp: undefined as unknown as Date,
    });

    const metrics = service.getChatMetrics();
    expect(metrics[0].timestamp).toBeDefined();
    expect(metrics[0].timestamp).toBeInstanceOf(Date);
  });
});
