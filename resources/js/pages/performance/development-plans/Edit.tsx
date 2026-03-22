import DevelopmentPlanForm from '@/components/performance/DevelopmentPlanForm';
import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal, DevelopmentPlanAction, Option } from '@/types/performance';
import { useForm } from '@inertiajs/react';

const breadcrumbs = (appraisal: Appraisal): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Development Plans', href: route('performance.development_plans.index') },
    { title: appraisal.employee_name_snapshot, href: route('performance.development_plans.show', appraisal.id) },
    { title: 'Edit', href: route('performance.development_plans.edit', appraisal.id) },
];

export default function DevelopmentPlanEdit({ appraisal, userOptions }: { appraisal: Appraisal; userOptions: Option[] }) {
    const { data, setData, put, processing } = useForm({
        strengths: appraisal.development_plan?.strengths ?? '',
        improvement_areas: appraisal.development_plan?.improvement_areas ?? '',
        follow_up_notes: appraisal.development_plan?.follow_up_notes ?? '',
        actions:
            appraisal.development_plan?.actions?.map((action) => ({
                action: action.action,
                owner_user_id: action.owner_user_id ?? null,
                due_date: action.due_date ?? '',
                status: action.status ?? 'pending',
                follow_up_status: action.follow_up_status ?? '',
            })) ?? [],
    });

    const updateAction = (index: number, field: string, value: string | number | null) => {
        const next = [...data.actions];
        next[index] = { ...next[index], [field]: value };
        setData('actions', next);
    };

    const addAction = () => {
        setData('actions', [...data.actions, { action: '', owner_user_id: null, due_date: '', status: 'pending', follow_up_status: '' }]);
    };

    const removeAction = (index: number) => {
        setData('actions', data.actions.filter((_, itemIndex) => itemIndex !== index));
    };

    return (
        <PerformancePage title="Edit Development Plan" description="Capture agreed strengths, gaps, and development actions." breadcrumbs={breadcrumbs(appraisal)}>
            <Card>
                <CardContent className="space-y-4 p-6">
                    <DevelopmentPlanForm
                        strengths={data.strengths}
                        improvementAreas={data.improvement_areas}
                        followUpNotes={data.follow_up_notes}
                        actions={data.actions as DevelopmentPlanAction[]}
                        userOptions={userOptions}
                        onChange={(field, value) => setData(field, value)}
                        onActionChange={updateAction}
                        onAddAction={addAction}
                        onRemoveAction={removeAction}
                    />
                    <Button type="button" onClick={() => put(route('performance.development_plans.update', appraisal.id))} disabled={processing}>
                        Save Development Plan
                    </Button>
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
