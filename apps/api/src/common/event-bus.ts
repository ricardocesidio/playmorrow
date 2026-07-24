import { Injectable } from '@nestjs/common';

export type PlaymorrowEvent = {
  type: string;
  actorId?: string;
  targetId?: string;
  targetType?: string;
  studioId?: string;
  gameId?: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class EventBus {
  private handlers = new Map<string, ((event: PlaymorrowEvent) => void)[]>();

  emit(event: PlaymorrowEvent): void {
    const handlers = this.handlers.get(event.type) ?? [];
    handlers.forEach((h) => h(event));
  }

  on(eventType: string, handler: (event: PlaymorrowEvent) => void): void {
    if (!this.handlers.has(eventType)) this.handlers.set(eventType, []);
    this.handlers.get(eventType)!.push(handler);
  }
}
