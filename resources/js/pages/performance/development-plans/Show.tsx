import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal, Option } from '@/types/performance';
import { Link } from '@inertiajs/react';

const breadcrumbs = (appraisal: Appraisal): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Development Plans', href: route('performance.development_plans.index') },
    { title: appraisal.employee_name_snapshot, href: route('performance.development_plans.show', appraisal.id) },
];

export default function DevelopmentPlanShow({ appraisal, userOptions }: { appraisal: Appraisal; userOptions: Option[] }) {
    void userOptions;

    return (
        <PerformancePage
            title="Development Plan"
            description="View agreed development actions and follow-up status."
            breadcrumbs={breadcrumbs(appraisal)}
            secondaryActions={
                <Button asChild variant="outline">
                    <Link href={route('performance.development_plans.edit', appraisal.id)}>Edit Plan</Link>
                </Button>
            }
        >
            <Card>
                <CardHeader>
                    <CardTitle>{appraisal.employee_name_snapshot}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div>Strengths: {appraisal.development_plan?.strengths ?? 'Not captured'}</div>
                    <div>Improvement areas: {appraisal.development_plan?.improvement_areas ?? 'Not captured'}</div>
                    <div>Follow-up notes: {appraisal.development_plan?.follow_up_notes ?? 'Not captured'}</div>
                    <div className="space-y-2">
                        {(appraisal.development_plan?.actions ?? []).map((action, index) => (
                            <div key={`plan-action-${index}`} className="rounded-lg border p-3">
                                <div className="font-medium">{action.action}</div>
                                <div className="text-muted-foreground">
                                    {action.owner?.name ?? 'No owner'} · {action.status ?? 'pending'} · {action.due_date ?? 'No due date'}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
