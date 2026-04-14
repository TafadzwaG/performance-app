import AppLogoIcon from '@/components/app-logo-icon';
import type { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

interface BrandLogoProps {
    className?: string;
    iconClassName?: string;
    alt?: string;
}

export default function BrandLogo({ className = 'size-8 rounded-md object-contain', iconClassName = 'size-8 fill-current', alt = 'System logo' }: BrandLogoProps) {
    const { branding } = usePage<SharedData>().props;

    if (branding?.logoUrl) {
        return <img src={branding.logoUrl} alt={alt} className={className} />;
    }

    return <AppLogoIcon className={iconClassName} />;
}
