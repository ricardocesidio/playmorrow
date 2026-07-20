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
  const [mode, setMode] = useState<'edit' | 'preview' | 'live'>('edit');

  const modes = ['live', 'edit', 'preview'] as const;
  const modeLabels = { live: 'Split view', edit: 'Edit mode', preview: 'Preview mode' };

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const direction = e.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (currentIndex + direction + modes.length) % modes.length;
      const nextMode = modes[nextIndex];
      if (nextMode) setMode(nextMode);
    }
  };

  return (
    <div data-color-mode="dark">
      <div className="flex items-center gap-1 mb-2 border-b border-border/50 pb-2" role="tablist" aria-label="Editor modes">
        {modes.map((m, index) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            aria-controls={`editor-${m}`}
            onClick={() => setMode(m)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            aria-label={modeLabels[m]}
            tabIndex={mode === m ? 0 : -1}
            className={`cursor-pointer px-3 py-1 font-mono text-[0.6rem] uppercase tracking-widest border-b-2 transition focus:outline-none focus:ring-1 focus:ring-cyan/50 ${
              mode === m ? 'border-cyan text-cyan' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {m === 'live' ? 'Split' : m === 'edit' ? 'Edit' : 'Preview'}
          </button>
        ))}
      </div>
      <div id={`editor-${mode}`} role="tabpanel">
        <MDEditor
          value={value}
          onChange={(val) => onChange(val ?? '')}
          minHeight={minHeight}
          preview={mode}
        />
      </div>
    </div>
  );
}
