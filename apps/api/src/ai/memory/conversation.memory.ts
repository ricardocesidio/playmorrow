import { Injectable, Logger } from '@nestjs/common';

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ConversationSession {
  id: string;
  userId: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ConversationMemory {
  private readonly logger = new Logger(ConversationMemory.name);
  private sessions = new Map<string, ConversationSession>();
  private readonly maxMessages = 50;

  addMessage(sessionId: string, message: ConversationMessage): void {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        userId: '',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.sessions.set(sessionId, session);
    }
    session.messages.push({
      ...message,
      timestamp: message.timestamp ?? new Date(),
    });
    session.updatedAt = new Date();

    if (session.messages.length > this.maxMessages) {
      this.trim(sessionId);
    }
  }

  getMessages(sessionId: string): ConversationMessage[] {
    return this.sessions.get(sessionId)?.messages ?? [];
  }

  clear(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages = [];
      session.updatedAt = new Date();
    }
  }

  summarize(sessionId: string): string {
    const messages = this.getMessages(sessionId);
    if (messages.length === 0) return '';
    const userMessages = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content);
    return `Summary of ${messages.length} messages: ${userMessages.join('; ')}`;
  }

  trim(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.messages.length <= this.maxMessages) return;

    const excess = session.messages.length - this.maxMessages;
    const summary = this.summarize(sessionId);

    session.messages = [
      {
        role: 'system',
        content: `Previous conversation summary: ${summary}`,
        timestamp: new Date(),
      },
      ...session.messages.slice(excess),
    ];
    session.updatedAt = new Date();
  }

  deleteUserData(userId: string): void {
    let deleted = 0;
    for (const [sessionId, session] of this.sessions) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
        deleted++;
      }
    }
    this.logger.log(`Deleted ${deleted} sessions for user ${userId}`);
  }

  createSession(sessionId: string, userId: string): ConversationSession {
    const session: ConversationSession = {
      id: sessionId,
      userId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): ConversationSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessionIds(): string[] {
    return Array.from(this.sessions.keys());
  }
}
