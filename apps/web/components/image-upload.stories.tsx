import type { Meta, StoryObj } from '@storybook/react';
import { ImageUpload } from './image-upload';
import { useState } from 'react';

const meta: Meta<typeof ImageUpload> = {
  title: 'Form/ImageUpload',
  component: ImageUpload,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ImageUpload>;

export const Empty: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div className="w-96">
        <ImageUpload value={value} onChange={setValue} label="Cover Image" />
      </div>
    );
  },
};

export const WithValue: Story = {
  render: () => {
    const [value, setValue] = useState('https://picsum.photos/seed/1/800/400');
    return (
      <div className="w-96">
        <ImageUpload value={value} onChange={setValue} label="Cover Image" />
      </div>
    );
  },
};
