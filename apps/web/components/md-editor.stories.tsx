import type { Meta, StoryObj } from '@storybook/react';
import { MarkdownEditor } from './md-editor';
import { useState } from 'react';

const meta: Meta<typeof MarkdownEditor> = {
  title: 'Form/MarkdownEditor',
  component: MarkdownEditor,
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
type Story = StoryObj<typeof MarkdownEditor>;

export const Empty: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return <MarkdownEditor value={value} onChange={setValue} />;
  },
};

export const WithContent: Story = {
  render: () => {
    const [value, setValue] = useState(`# Hello World

This is a **markdown** preview with [links](https://example.com).

- List item 1
- List item 2
- List item 3

> A blockquote`);
    return <MarkdownEditor value={value} onChange={setValue} />;
  },
};

export const ShortHeight: Story = {
  render: () => {
    const [value, setValue] = useState('# Short editor');
    return <MarkdownEditor value={value} onChange={setValue} minHeight={150} />;
  },
};
