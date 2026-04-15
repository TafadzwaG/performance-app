import Heading from '@/components/heading';
import PerformanceErrorBoundary from '@/components/performance/PerformanceErrorBoundary';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

interface PerformancePageProps {
    title: string;
    description?: string;
    breadcrumbs: BreadcrumbItem[];
    children: ReactNode;
    primaryAction?: {
        label: string;
        href: string;
        icon?: ReactNode;
    };
    secondaryActions?: ReactNode;
}

export default function PerformancePage({
    title,
    description,
    breadcrumbs,
    children,
    primaryAction,
    secondaryActions,
}: PerformancePageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />
            <div className="flex h-full flex-1 flex-col gap-5 rounded-lg p-3 md:p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <Heading title={title} description={description} />
                    <div className="flex flex-wrap items-center gap-2">
                        {secondaryActions}
                        {primaryAction ? (
                            <Button asChild size="sm">
                                <Link href={primaryAction.href} className="inline-flex items-center gap-2">
                                    {primaryAction.icon}
                                    <span>{primaryAction.label}</span>
                                </Link>
                            </Button>
                        ) : null}
                    </div>
                </div>
                <PerformanceErrorBoundary>{children}</PerformanceErrorBoundary>
            </div>
        </AppLayout>
    );
}
