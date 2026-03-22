import PerformancePage from '@/components/performance/PerformancePage';
import RatingScaleLegend from '@/components/performance/RatingScaleLegend';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Template } from '@/types/performance';
import { Link } from '@inertiajs/react';

const breadcrumbs = (template: Template): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Templates', href: route('performance.templates.index') },
    { title: template.name, href: route('performance.templates.show', template.id) },
];

export default function TemplateShow({ template }: { template: Template }) {
    return (
        <PerformancePage
            title={template.name}
            description="Template summary, scales, and configured items."
            breadcrumbs={breadcrumbs(template)}
            secondaryActions={
                <>
                    <Button asChild variant="outline">
                        <Link href={route('performance.templates.edit', template.id)}>Edit</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={route('performance.templates.builder', template.id)}>Builder</Link>
                    </Button>
                </>
            }
        >
            <div className="grid gap-4">
                <Card>
                    <CardContent className="space-y-3 p-6 text-sm">
                        <div>Code: {template.code}</div>
                        <div>Version: {template.version}</div>
                        <div>Business/Values split: {template.business_weight_percent}/{template.values_weight_percent}</div>
                        <div>Description: {template.description ?? '-'}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="space-y-3 p-6 text-sm">
                        <div className="font-medium">Overall Rating Scale</div>
                        <RatingScaleLegend levels={template.overall_rating_scale?.levels ?? []} />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="space-y-2 p-6 text-sm">
                        {(template.items ?? []).map((item) => (
                            <div key={item.id ?? `${item.item_type}-${item.sort_order}`} className="rounded-lg border p-3">
                                <div className="font-medium">{item.title}</div>
                                <div className="text-muted-foreground">{item.item_type}</div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </PerformancePage>
    );
}
