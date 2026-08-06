import { Test } from '@nestjs/testing';
import { Subject } from 'rxjs';
import { RedisPubSubService } from '../common/redis-pubsub.service';
import { NotificationPubSubService } from './notification-pubsub.service';

describe('NotificationPubSubService', () => {
  let mockRedisPubSub: { publish: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn> };

  const createService = async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationPubSubService,
        { provide: RedisPubSubService, useValue: mockRedisPubSub },
      ],
    }).compile();
    return moduleRef.get(NotificationPubSubService);
  };

  beforeEach(() => {
    mockRedisPubSub = {
      publish: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockReturnValue(() => {}),
    };
  });

  it('publish sends a tagged payload to Redis', async () => {
    const service = await createService();
    service.publish({ recipientId: 'u1', unreadCount: 3 });

    const [channel, payload] = mockRedisPubSub.publish.mock.calls[0] as [string, { instanceId: string; event: { recipientId: string; unreadCount: number } }];
    expect(channel).toBe('playmorrow:notifications');
    expect(payload.event).toEqual({ recipientId: 'u1', unreadCount: 3 });
    expect(payload.instanceId).toBeTruthy();
  });

  it('wire relays events published by other instances', async () => {
    const service = await createService();
    const events$ = new Subject<{ recipientId: string; unreadCount: number }>();
    const emitted: { recipientId: string; unreadCount: number }[] = [];
    events$.subscribe((e) => emitted.push(e));

    service.wire(events$);

    const handler = mockRedisPubSub.subscribe.mock.calls[0]?.[1] as (msg: { instanceId: string; event: { recipientId: string; unreadCount: number } }) => void;
    handler({ instanceId: 'other-instance', event: { recipientId: 'u2', unreadCount: 7 } });

    expect(emitted).toEqual([{ recipientId: 'u2', unreadCount: 7 }]);
  });

  it('wire ignores events this instance published itself', async () => {
    const service = await createService();
    const events$ = new Subject<{ recipientId: string; unreadCount: number }>();
    const emitted: { recipientId: string; unreadCount: number }[] = [];
    events$.subscribe((e) => emitted.push(e));

    service.wire(events$);

    const handler = mockRedisPubSub.subscribe.mock.calls[0]?.[1] as (msg: { instanceId: string; event: { recipientId: string; unreadCount: number } }) => void;
    handler({ instanceId: (service as unknown as { instanceId: string }).instanceId, event: { recipientId: 'u1', unreadCount: 5 } });

    expect(emitted).toEqual([]);
  });
});
