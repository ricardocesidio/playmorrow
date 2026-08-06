import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Subject } from 'rxjs';
import { RedisPubSubService } from '../common/redis-pubsub.service';
import type { NotificationEvent } from './notifications.service';

const CHANNEL = 'playmorrow:notifications';

/**
 * Fan notification events across API instances via Redis pub/sub (#24).
 *
 * Each instance keeps its own in-process `events$` Subject for its local SSE
 * subscribers. When a notification is created the local Subject fires AND the
 * event is published to Redis; every instance relays Redis messages into its
 * own Subject, skipping messages it published itself. Single-instance or
 * no-Redis deployments behave exactly as before (RedisPubSubService is
 * fail-open), and multi-instance deployments get cross-instance SSE delivery.
 */
@Injectable()
export class NotificationPubSubService {
  private readonly instanceId = randomUUID();

  constructor(private readonly redisPubSub: RedisPubSubService) {}

  /** Relay Redis events from other instances into the local SSE Subject. */
  wire(events$: Subject<NotificationEvent>): void {
    this.redisPubSub.subscribe<{ instanceId: string; event: NotificationEvent }>(
      CHANNEL,
      ({ instanceId, event }) => {
        if (instanceId === this.instanceId) return;
        events$.next(event);
      },
    );
  }

  /** Publish a notification event to every API instance. Never throws. */
  publish(event: NotificationEvent): void {
    void this.redisPubSub.publish(CHANNEL, { instanceId: this.instanceId, event });
  }
}
