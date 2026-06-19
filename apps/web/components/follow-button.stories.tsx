import type { Meta, StoryObj } from '@storybook/react';
import { FollowButton } from './follow-button';

const meta: Meta<typeof FollowButton> = {
  title: 'Social/FollowButton',
  component: FollowButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FollowButton>;

export const Studio: Story = {
  args: { targetType: 'studio', slug: 'test-studio' },
};

export const Game: Story = {
  args: { targetType: 'game', slug: 'test-game' },
};
