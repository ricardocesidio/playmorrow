import type { Meta, StoryObj } from '@storybook/react';
import { Tag } from './tag';

const meta: Meta<typeof Tag> = {
  title: 'UI/Tag',
  component: Tag,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Default: Story = {
  args: { children: 'Indie' },
};

export const Multiple: Story = {
  render: () => (
    <div className="flex gap-2">
      <Tag>Action</Tag>
      <Tag>RPG</Tag>
      <Tag>Puzzle</Tag>
    </div>
  ),
};
