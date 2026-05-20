import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'group relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-[0.8125rem] font-medium ring-offset-background transition-all duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                // Primary — ink on cream (dark on light). The signature CTA.
                default:
                    'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md hover:-translate-y-px',

                // Secondary — sand. Warm, friendly, the "do-it-again" action.
                secondary:
                    'bg-secondary text-secondary-foreground hover:bg-secondary/85 shadow-sm hover:shadow-md',

                // Accent — pine green. Confirmations, primary in alt contexts.
                accent:
                    'bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm hover:shadow-md hover:-translate-y-px',

                // Success — deep forest. Approve / submit.
                success:
                    'bg-success text-success-foreground hover:bg-success/90 shadow-sm',

                // Warning — burnt copper. Caution, pending.
                warning:
                    'bg-warning text-warning-foreground hover:bg-warning/90 shadow-sm',

                // Info — slate blue. Neutral informational actions.
                info:
                    'bg-info text-info-foreground hover:bg-info/90 shadow-sm',

                // Destructive — reject / delete.
                destructive:
                    'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',

                // Outline — paper card with ink border. Tertiary actions.
                outline:
                    'border border-foreground/15 bg-background text-foreground hover:border-foreground/40 hover:bg-secondary/30',

                // Soft — sand wash. Quiet tonal action.
                soft:
                    'bg-secondary/25 text-foreground hover:bg-secondary/45 border border-secondary/40',

                // Ghost — invisible until hover.
                ghost: 'hover:bg-secondary/30 text-foreground hover:text-foreground',

                // Link — minimal underline.
                link: 'text-foreground underline-offset-4 hover:underline decoration-secondary decoration-2',
            },
            size: {
                default: 'h-9 px-3.5 py-1.5',
                sm: 'h-8 rounded-md px-3 text-[0.75rem]',
                lg: 'h-11 rounded-md px-6 text-sm tracking-wide',
                xl: 'h-12 rounded-md px-8 text-sm tracking-wide',
                icon: 'h-9 w-9',
                'icon-sm': 'h-8 w-8',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
