import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

/**
 * Server-side HTML sanitization (defense in depth).
 *
 * Strips dangerous HTML (scripts, event handlers, iframes, etc.) from
 * user-generated content. Markdown that doesn't contain HTML passes through
 * untouched. This runs at write time so stored data is safe regardless of
 * what sanitization happens at render time.
 */
export function sanitizeHtml(dirty: string): string {
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'strong', 'em', 'u', 's', 'del', 'ins', 'sub', 'sup', 'mark',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
      'figure', 'figcaption',
      'video', 'source',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel',
      'src', 'alt', 'width', 'height',
      'class', 'id', 'style',
    ],
    ALLOW_DATA_ATTR: true,
  });
}