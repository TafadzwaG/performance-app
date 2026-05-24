import { MonLogo } from '@/components/mon-logo';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';

type LandingBrandMarkProps = {
    className?: string;
    imgClassName?: string;
    withBackdrop?: boolean;
};

export default function LandingBrandMark({
    className = 'group flex shrink-0 items-center',
    imgClassName = 'h-14 w-auto max-w-[min(320px,72vw)] transition-opacity group-hover:opacity-90 sm:h-16 lg:h-[4.5rem] lg:max-w-[360px]',
    withBackdrop = true,
}: LandingBrandMarkProps) {
    return (
        <Link href={route('home')} className={cn(className)}>
            <MonLogo className={imgClassName} withBackdrop={withBackdrop} />
        </Link>
    );
}
