import monLogo from '@/assets/monlogo.png';
import { cn } from '@/lib/utils';

interface MonLogoProps {
    className?: string;
    /** Adds a light surface so the dark logo asset stays visible on dark backgrounds. */
    withBackdrop?: boolean;
    backdropClassName?: string;
}

export function MonLogo({
    className,
    withBackdrop = true,
    backdropClassName,
}: MonLogoProps) {
    const image = (
        <img
            src={monLogo}
            alt="Monomotapa Performance Appraisal"
            className={cn('object-contain', className)}
        />
    );

    if (!withBackdrop) {
        return image;
    }

    return (
        <span
            className={cn(
                'inline-flex rounded-md bg-white px-2.5 py-1 shadow-sm ring-1 ring-black/5 dark:bg-white dark:ring-white/15',
                backdropClassName,
            )}
        >
            {image}
        </span>
    );
}
