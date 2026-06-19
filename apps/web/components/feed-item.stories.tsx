import type { Meta, StoryObj } from '@storybook/react';
import { FeedItemCard } from './feed-item';
import { MOCK_FEED_ITEM_DEVLOG } from '@/lib/api/mock-data';

const meta: Meta<typeof FeedItemCard> = {
  title: 'Feed/FeedItemCard',
  component: FeedItemCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FeedItemCard>;

export const Devlog: Story = {
  args: { item: MOCK_FEED_ITEM_DEVLOG as unknown as typeof MOCK_FEED_ITEM_DEVLOG },
};
