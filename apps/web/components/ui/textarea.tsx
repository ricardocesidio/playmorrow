import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'clip-corner flex min-h-[80px] w-full border bg-background px-4 py-3 font-mono text-xs text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-cyan focus-visible:outline-none disabled:opacity-50',
        error ? 'border-coral' : 'border-input',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
