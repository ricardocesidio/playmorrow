'use client';

import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
}

export function MarkdownEditor({ value, onChange, minHeight = 300 }: MarkdownEditorProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div data-color-mode={mounted && theme === 'dark' ? 'dark' : 'light'}>
      <MDEditor
        value={value}
        onChange={(val) => onChange(val ?? '')}
        minHeight={minHeight}
        preview="live"
      />
    </div>
  );
}
