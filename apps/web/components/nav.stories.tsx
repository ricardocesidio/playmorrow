import type { Meta, StoryObj } from '@storybook/react';
import { Nav } from './nav';

const meta: Meta<typeof Nav> = {
  title: 'Layout/Nav',
  component: Nav,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Nav>;

export const Default: Story = {};
