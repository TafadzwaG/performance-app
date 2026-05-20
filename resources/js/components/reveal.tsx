import { useInView } from '@/hooks/use-in-view';
import { cn } from '@/lib/utils';
import * as React from 'react';

type RevealVariant = 'rise' | 'fade' | 'slide-left' | 'slide-right' | 'zoom' | 'sweep';

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
    as?: keyof React.JSX.IntrinsicElements;
    variant?: RevealVariant;
    delay?: number;
    duration?: number;
    threshold?: number;
    once?: boolean;
}

const initialStyles: Record<RevealVariant, React.CSSProperties> = {
    rise: { opacity: 0, transform: 'translateY(28px)' },
    fade: { opacity: 0 },
    'slide-left': { opacity: 0, transform: 'translateX(-32px)' },
    'slide-right': { opacity: 0, transform: 'translateX(32px)' },
    zoom: { opacity: 0, transform: 'scale(0.94)' },
    sweep: { opacity: 0, transform: 'translateY(40px) skewY(2deg)' },
};

export function Reveal({
    as: Tag = 'div',
    variant = 'rise',
    delay = 0,
    duration = 900,
    threshold = 0.18,
    once = true,
    className,
    style,
    children,
    ...rest
}: RevealProps) {
    const { ref, inView } = useInView<HTMLDivElement>({ threshold, once });

    const initial = initialStyles[variant];
    const composedStyle: React.CSSProperties = {
        ...style,
        ...(inView
            ? { opacity: 1, transform: 'translate(0,0) scale(1) skewY(0)' }
            : initial),
        transition: `opacity ${duration}ms cubic-bezier(0.2, 0.7, 0.2, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.2, 0.7, 0.2, 1) ${delay}ms`,
        willChange: 'opacity, transform',
    };

    const Component = Tag as React.ElementType;
    return (
        <Component ref={ref} className={cn(className)} style={composedStyle} {...rest}>
            {children}
        </Component>
    );
}
