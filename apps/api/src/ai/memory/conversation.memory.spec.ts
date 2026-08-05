import { Test, TestingModule } from '@nestjs/testing';
import { ConversationMemory, ConversationSession } from '../memory/conversation.memory';

describe('ConversationMemory', () => {
  let memory: ConversationMemory;
  const userId = 'user-1';
  const sessionId = 'session-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConversationMemory],
    }).compile();

    memory = module.get(ConversationMemory);
  });

  it('should be defined', () => {
    expect(memory).toBeDefined();
  });

  it('should add messages to a session', () => {
    memory.addMessage(sessionId, {
      role: 'user',
      content: 'Hello, what games are trending?',
      timestamp: new Date(),
    });

    const messages = memory.getMessages(sessionId);
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toBe('Hello, what games are trending?');
  });

  it('should retrieve all messages for a session', () => {
    memory.addMessage(sessionId, { role: 'user', content: 'First message', timestamp: new Date() });
    memory.addMessage(sessionId, { role: 'assistant', content: 'First response', timestamp: new Date() });
    memory.addMessage(sessionId, { role: 'user', content: 'Follow up', timestamp: new Date() });

    const messages = memory.getMessages(sessionId);
    expect(messages).toHaveLength(3);
    expect(messages[0].content).toBe('First message');
    expect(messages[1].role).toBe('assistant');
  });

  it('should clear a session', () => {
    memory.addMessage(sessionId, { role: 'user', content: 'Message to clear', timestamp: new Date() });
    expect(memory.getMessages(sessionId)).toHaveLength(1);

    memory.clear(sessionId);
    expect(memory.getMessages(sessionId)).toHaveLength(0);
  });

  it('should summarize conversation', () => {
    memory.addMessage(sessionId, { role: 'user', content: 'Find RPG games', timestamp: new Date() });
    memory.addMessage(sessionId, { role: 'assistant', content: 'Here are some RPGs...', timestamp: new Date() });
    memory.addMessage(sessionId, { role: 'user', content: 'Filter by indie', timestamp: new Date() });

    const summary = memory.summarize(sessionId);
    expect(summary).toContain('Summary');
    expect(summary).toContain('Find RPG games');
    expect(summary).toContain('Filter by indie');
  });

  it('should return empty string for empty session summary', () => {
    expect(memory.summarize('nonexistent')).toBe('');
  });

  it('should trim old messages when exceeding limit', () => {
    for (let i = 0; i < 55; i++) {
      memory.addMessage(sessionId, {
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        timestamp: new Date(),
      });
    }

    const messages = memory.getMessages(sessionId);
    expect(messages.length).toBeLessThanOrEqual(51);
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('Previous conversation summary');
  });

  it('should delete user data for GDPR compliance', () => {
    memory.createSession('session-a', userId);
    memory.createSession('session-b', userId);
    memory.createSession('session-c', 'other-user');

    memory.addMessage('session-a', { role: 'user', content: 'Data to delete', timestamp: new Date() });

    memory.deleteUserData(userId);

    expect(memory.getMessages('session-a')).toHaveLength(0);
    expect(memory.getMessages('session-b')).toHaveLength(0);
    expect(memory.getSession('session-c')).toBeDefined();
  });

  it('should handle multiple sessions independently', () => {
    memory.createSession('session-1', 'user-a');
    memory.createSession('session-2', 'user-b');

    memory.addMessage('session-1', { role: 'user', content: 'User A message', timestamp: new Date() });
    memory.addMessage('session-2', { role: 'user', content: 'User B message', timestamp: new Date() });

    expect(memory.getMessages('session-1')[0].content).toBe('User A message');
    expect(memory.getMessages('session-2')[0].content).toBe('User B message');
    expect(memory.getMessages('session-1')).toHaveLength(1);
    expect(memory.getMessages('session-2')).toHaveLength(1);
  });

  it('should create a new session with userId', () => {
    const session = memory.createSession('new-session', 'user-42');

    expect(session.id).toBe('new-session');
    expect(session.userId).toBe('user-42');
    expect(session.messages).toEqual([]);
    expect(session.createdAt).toBeDefined();
  });

  it('should return all session IDs', () => {
    memory.createSession('a', 'user-1');
    memory.createSession('b', 'user-1');
    memory.createSession('c', 'user-2');

    const ids = memory.getAllSessionIds();
    expect(ids).toContain('a');
    expect(ids).toContain('b');
    expect(ids).toContain('c');
    expect(ids).toHaveLength(3);
  });

  it('should add timestamp to messages if not provided', () => {
    memory.addMessage(sessionId, {
      role: 'user',
      content: 'No timestamp',
      timestamp: undefined as unknown as Date,
    });

    const messages = memory.getMessages(sessionId);
    expect(messages[0].timestamp).toBeDefined();
    expect(messages[0].timestamp).toBeInstanceOf(Date);
  });
});
