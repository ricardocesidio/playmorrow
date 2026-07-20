'use client';

import dynamic from 'next/dynamic';
import DOMPurify from 'dompurify';

const MDMarkdown = dynamic(
  () => import('@uiw/react-md-editor').then((m) => m.default.Markdown),
  { ssr: false }
);

interface SanitizedMarkdownProps {
  source: string;
  className?: string;
}

/**
 * Explicitly wraps Markdown rendering with DOMPurify sanitization.
 * This ensures user-generated devlog content is sanitized at render time,
 * independent of any server-side or editor sanitization.
 * Defense-in-depth for XSS.
 */
export function SanitizedMarkdown({ source, className }: SanitizedMarkdownProps) {
  const sanitized = DOMPurify.sanitize(source);
  return (
    <div data-color-mode="dark" className={className}>
      <MDMarkdown source={sanitized} />
    </div>
  );
}
