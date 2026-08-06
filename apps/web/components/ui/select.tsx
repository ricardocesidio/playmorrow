import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'clip-corner flex h-12 w-full border bg-background px-4 font-mono text-xs text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-cyan focus-visible:outline-none disabled:opacity-50',
        error ? 'border-coral' : 'border-input',
        className,
      )}
      {...props}
    />
  ),
);
Select.displayName = 'Select';
