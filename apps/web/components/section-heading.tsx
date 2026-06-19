import type { ReactNode } from 'react';

interface SectionHeadingProps {
  children: ReactNode;
  tag?: string;
  as?: 'h1' | 'h2' | 'h3';
}

export function SectionHeading({ children, tag, as: Tag = 'h2' }: SectionHeadingProps) {
  return (
    <div className="mb-6">
      {tag && (
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-cyan">{tag}</p>
      )}
      <Tag className="font-display text-2xl font-semibold tracking-tight">{children}</Tag>
    </div>
  );
}
