'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
}

export function MarkdownEditor({ value, onChange, minHeight = 300 }: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview' | 'live'>('live');

  return (
    <div data-color-mode="dark">
      <div className="flex items-center gap-1 mb-2 border-b border-border/50 pb-2">
        {(['live', 'edit', 'preview'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`cursor-pointer px-3 py-1 font-mono text-[0.6rem] uppercase tracking-widest border-b-2 transition ${
              mode === m ? 'border-cyan text-cyan' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {m === 'live' ? 'Split' : m === 'edit' ? 'Edit' : 'Preview'}
          </button>
        ))}
      </div>
      <MDEditor
        value={value}
        onChange={(val) => onChange(val ?? '')}
        minHeight={minHeight}
        preview={mode}
      />
    </div>
  );
}
