import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const inputVariants = cva(
  "clip-corner h-12 w-full border bg-background/80 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/55 transition-colors focus:ring-1",
  {
    variants: {
      error: {
        true: "border-coral focus:border-coral focus:ring-coral",
        false: "border-input focus:border-cyan focus:ring-cyan",
      },
    },
    defaultVariants: {
      error: false,
    },
  },
);

export interface InputProps
  extends React.ComponentProps<'input'>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        data-slot="input"
        className={cn(inputVariants({ error, className }))}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input, inputVariants };
