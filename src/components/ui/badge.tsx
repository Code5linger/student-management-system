import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-brand-dark',
        secondary: 'bg-muted text-ink/70',
        destructive: 'bg-destructive text-white',
        destructiveSoft: 'bg-destructive/10 text-destructive',
        outline: 'border border-border text-foreground',
        gold: 'bg-gold/15 text-gold',
        goldSoft: 'bg-gold/20 text-gold',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
