import { Test, TestingModule } from '@nestjs/testing';
import { PromptRegistry } from '../prompts/prompt.registry';

describe('PromptRegistry', () => {
  let registry: PromptRegistry;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromptRegistry],
    }).compile();
    registry = module.get(PromptRegistry);
  });

  it('should be defined', () => {
    expect(registry).toBeDefined();
  });

  it('should register a template', () => {
    registry.register({
      name: 'test-prompt',
      version: 1,
      systemPrompt: 'You are a test bot.',
      template: 'Answer this: {{ question }}',
      variables: ['question'],
    });

    const template = registry.getLatest('test-prompt');
    expect(template).toBeDefined();
    expect(template.name).toBe('test-prompt');
    expect(template.version).toBe(1);
  });

  it('should resolve template with variables', () => {
    registry.register({
      name: 'greeting',
      version: 1,
      systemPrompt: 'Assistant',
      template: 'Hello {{ name }}, welcome to {{ platform }}!',
      variables: ['name', 'platform'],
    });

    const resolved = registry.resolve('greeting', { name: 'Alice', platform: 'Playmorrow' });
    expect(resolved).toBe('Hello Alice, welcome to Playmorrow!');
  });

  it('should resolve system prompt', () => {
    registry.register({
      name: 'search',
      version: 1,
      systemPrompt: 'You are {{ role }} for {{ company }}.',
      template: 'Search: {{ query }}',
      variables: ['role', 'company', 'query'],
    });

    const resolved = registry.resolveSystem('search', { role: 'assistant', company: 'Playmorrow' });
    expect(resolved).toBe('You are assistant for Playmorrow.');
  });

  it('should get latest version', () => {
    registry.register({
      name: 'evolving',
      version: 1,
      systemPrompt: 'v1 system',
      template: 'Template v1',
      variables: [],
    });
    registry.register({
      name: 'evolving',
      version: 2,
      systemPrompt: 'v2 system',
      template: 'Template v2',
      variables: [],
    });

    const latest = registry.getLatest('evolving');
    expect(latest.version).toBe(2);
    expect(latest.template).toBe('Template v2');
  });

  it('should get specific version', () => {
    registry.register({
      name: 'versioned',
      version: 1,
      systemPrompt: 'First',
      template: 'Version 1 content',
      variables: [],
    });
    registry.register({
      name: 'versioned',
      version: 2,
      systemPrompt: 'Second',
      template: 'Version 2 content',
      variables: [],
    });

    const v1 = registry.getVersion('versioned', 1);
    expect(v1.template).toBe('Version 1 content');

    const v2 = registry.getVersion('versioned', 2);
    expect(v2.template).toBe('Version 2 content');
  });

  it('should validate missing variables', () => {
    registry.register({
      name: 'required-vars',
      version: 1,
      systemPrompt: '',
      template: '{{ a }} {{ b }} {{ c }}',
      variables: ['a', 'b', 'c'],
    });

    const missing = registry.validate('required-vars', { a: 'val1' });
    expect(missing).toEqual(['b', 'c']);

    const none = registry.validate('required-vars', { a: 'val1', b: 'val2', c: 'val3' });
    expect(none).toEqual([]);
  });

  it('should list all templates', () => {
    registry.register({
      name: 'prompt-a',
      version: 1,
      systemPrompt: '',
      template: 'A',
      variables: [],
    });
    registry.register({
      name: 'prompt-b',
      version: 1,
      systemPrompt: '',
      template: 'B',
      variables: [],
    });

    const all = registry.listAll();
    expect(all).toHaveLength(2);
    expect(all.map((t) => t.name)).toContain('prompt-a');
    expect(all.map((t) => t.name)).toContain('prompt-b');
  });

  it('should throw for unregistered prompt', () => {
    expect(() => registry.getLatest('nonexistent')).toThrow('Prompt "nonexistent" is not registered');
    expect(() => registry.getVersion('nonexistent', 1)).toThrow('Prompt "nonexistent" is not registered');
  });

  it('should throw for non-existent version', () => {
    registry.register({
      name: 'single',
      version: 1,
      systemPrompt: '',
      template: 'Only version 1',
      variables: [],
    });

    expect(() => registry.getVersion('single', 99)).toThrow('Prompt "single" version 99 not found');
  });

  it('should register built-in prompts', () => {
    registry.registerBuiltInPrompts();
    const all = registry.listAll();
    const names = all.map((t) => t.name);

    expect(names).toContain('search-assistant');
    expect(names).toContain('game-description');
  });

  it('should version prompts correctly', () => {
    registry.register({
      name: 'versioned',
      version: 1,
      systemPrompt: 'Base',
      template: 'Base template',
      variables: [],
      description: 'Initial version',
    });
    registry.register({
      name: 'versioned',
      version: 2,
      systemPrompt: 'Improved',
      template: 'Improved template with {{ feature }}',
      variables: ['feature'],
      description: 'Added feature support',
    });

    const versions = registry.getVersions('versioned');
    expect(versions).toHaveLength(2);
    expect(versions[0].version).toBe(1);
    expect(versions[1].version).toBe(2);
    expect(versions[0].description).toBe('Initial version');
    expect(versions[1].description).toBe('Added feature support');
  });

  it('should resolve with specific version using resolve method', () => {
    registry.register({
      name: 'model',
      version: 1,
      systemPrompt: '',
      template: 'v1 {{ x }}',
      variables: ['x'],
    });
    registry.register({
      name: 'model',
      version: 2,
      systemPrompt: '',
      template: 'v2 {{ x }}',
      variables: ['x'],
    });

    const v1Result = registry.resolve('model', { x: 'test' }, 1);
    expect(v1Result).toBe('v1 test');

    const v2Result = registry.resolve('model', { x: 'test' }, 2);
    expect(v2Result).toBe('v2 test');
  });

  it('should create timestamps on registration', () => {
    const before = new Date();
    registry.register({
      name: 'timestamped',
      version: 1,
      systemPrompt: '',
      template: 'Test',
      variables: [],
    });

    const template = registry.getLatest('timestamped');
    expect(template.createdAt).toBeDefined();
    expect(template.createdAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});
