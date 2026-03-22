import PerformancePage from '@/components/performance/PerformancePage';
import RatingScaleLegend from '@/components/performance/RatingScaleLegend';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { RatingScale } from '@/types/performance';
import { Link } from '@inertiajs/react';

const breadcrumbs = (scale: RatingScale): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Rating Scales', href: route('performance.setup.rating_scales.index') },
    { title: scale.name, href: route('performance.setup.rating_scales.show', scale.id) },
];

export default function RatingScaleShow({ ratingScale }: { ratingScale: RatingScale }) {
    return (
        <PerformancePage
            title={ratingScale.name}
            description="Rating scale detail and configured levels."
            breadcrumbs={breadcrumbs(ratingScale)}
            secondaryActions={
                <Button asChild variant="outline">
                    <Link href={route('performance.setup.rating_scales.edit', ratingScale.id)}>Edit</Link>
                </Button>
            }
        >
            <Card>
                <CardContent className="space-y-4 p-6 text-sm">
                    <div>Code: {ratingScale.code}</div>
                    <div>Type: {ratingScale.applies_to}</div>
                    <div>Description: {ratingScale.description ?? '-'}</div>
                    <RatingScaleLegend levels={ratingScale.levels ?? []} />
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
