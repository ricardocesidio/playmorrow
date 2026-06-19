import type { Meta, StoryObj } from '@storybook/react';
import { GameCard } from './game-card';
import { MOCK_GAME } from '@/lib/api/mock-data';

const meta: Meta<typeof GameCard> = {
  title: 'Games/GameCard',
  component: GameCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GameCard>;

export const Default: Story = {
  args: { game: MOCK_GAME },
};

export const FreeGame: Story = {
  args: {
    game: { ...MOCK_GAME, isFree: true, priceCents: null },
  },
};

export const NoStudio: Story = {
  args: {
    game: { ...MOCK_GAME, studio: null as unknown as typeof MOCK_GAME.studio },
  },
};

export const NoCover: Story = {
  args: {
    game: { ...MOCK_GAME, coverUrl: null },
  },
};

export const ManyTags: Story = {
  args: {
    game: {
      ...MOCK_GAME,
      tags: ['action', 'rpg', 'puzzle', 'strategy', 'adventure'],
    },
  },
};
