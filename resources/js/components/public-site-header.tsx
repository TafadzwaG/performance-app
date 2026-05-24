import LandingBrandMark from '@/components/landing-brand-mark';
import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

type PublicSiteHeaderProps = {
    backHref?: string;
    backLabel?: string;
};

export default function PublicSiteHeader({ backHref = route('home'), backLabel = 'Welcome' }: PublicSiteHeaderProps) {
    const { auth } = usePage<SharedData>().props;

    return (
        <header className="relative z-20">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 pt-6 lg:px-10 lg:pt-8">
                <LandingBrandMark />

                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" className="hidden px-4 text-sm sm:inline-flex">
                        <Link href={backHref}>
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            {backLabel}
                        </Link>
                    </Button>
                    <Button asChild className="px-4 text-sm">
                        <Link href={auth.user ? route('dashboard') : route('login')}>
                            <span className="hidden sm:inline">{auth.user ? 'Open dashboard' : 'Enter studio'}</span>
                            <span className="sm:hidden">{auth.user ? 'Dashboard' : 'Sign in'}</span>
                            <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
            <div className="bg-foreground/10 mx-auto mt-6 h-px max-w-7xl px-6 lg:px-10" />
        </header>
    );
}
