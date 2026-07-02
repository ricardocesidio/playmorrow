import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-mono uppercase tracking-widest transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          'border border-cyan bg-cyan/10 text-cyan shadow-[0_0_20px_rgb(62_231_255_/_0.15)] hover:bg-cyan hover:text-cyan-foreground hover:shadow-[0_0_30px_rgb(62_231_255_/_0.25)]',
        destructive:
          'border border-coral bg-coral/10 text-coral shadow-[0_0_20px_rgb(255_87_77_/_0.15)] hover:bg-coral hover:text-coral-foreground hover:shadow-[0_0_30px_rgb(255_87_77_/_0.25)]',
        outline:
          'border border-border bg-transparent text-muted-foreground hover:border-cyan hover:text-cyan hover:shadow-[0_0_16px_rgb(62_231_255_/_0.1)]',
        secondary:
          'border border-violet/30 bg-violet/5 text-violet hover:bg-violet hover:text-violet-foreground',
        ghost:
          'text-muted-foreground hover:bg-cyan/5 hover:text-cyan',
        link: 'text-cyan underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2 has-[>svg]:px-4',
        sm: 'h-8 px-3 has-[>svg]:px-2.5 text-xs',
        lg: 'h-12 px-8 text-sm has-[>svg]:px-6',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
