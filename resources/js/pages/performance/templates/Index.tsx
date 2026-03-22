import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Paginated, Template } from '@/types/performance';
import { Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Templates', href: route('performance.templates.index') },
];

export default function TemplatesIndex({ templates }: { templates: Paginated<Template> }) {
    return (
        <PerformancePage title="Templates" description="Create appraisal templates with weights, scales, and item sets." breadcrumbs={breadcrumbs} primaryAction={{ label: 'New Template', href: route('performance.templates.create') }}>
            <Card>
                <CardContent className="space-y-4 p-6">
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="p-3">Template</th>
                                    <th className="p-3">Version</th>
                                    <th className="p-3">Business / Values</th>
                                    <th className="p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {templates.data.map((template) => (
                                    <tr key={template.id} className="border-t">
                                        <td className="p-3">{template.name}</td>
                                        <td className="p-3">{template.version}</td>
                                        <td className="p-3">
                                            {template.business_weight_percent}/{template.values_weight_percent}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={route('performance.templates.show', template.id)}>View</Link>
                                                </Button>
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={route('performance.templates.builder', template.id)}>Builder</Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <PaginationLinks paginated={templates} />
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
