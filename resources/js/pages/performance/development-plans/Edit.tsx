import DevelopmentPlanForm from '@/components/performance/DevelopmentPlanForm';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal, DevelopmentPlanAction, Option } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import { ClipboardList, FileText, Save, Target } from 'lucide-react';

const breadcrumbs = (appraisal: Appraisal): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Development Plans', href: route('performance.development_plans.index') },
    { title: appraisal.employee_name_snapshot, href: route('performance.development_plans.show', appraisal.id) },
    { title: 'Edit', href: route('performance.development_plans.edit', appraisal.id) },
];

export default function DevelopmentPlanEdit({
    appraisal,
    userOptions,
}: {
    appraisal: Appraisal;
    userOptions: Option[];
}) {
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
        setData('actions', [
            ...data.actions,
            {
                action: '',
                owner_user_id: null,
                due_date: '',
                status: 'pending',
                follow_up_status: '',
            },
        ]);
    };

    const removeAction = (index: number) => {
        setData(
            'actions',
            data.actions.filter((_, itemIndex) => itemIndex !== index),
        );
    };

    return (
        <PerformancePage
            title="Edit Development Plan"
            description="Capture agreed strengths, gaps, and development actions."
            breadcrumbs={breadcrumbs(appraisal)}
        >
            <div className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Development planning
                            </Badge>

                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                    Edit Development Plan
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                                    Capture agreed strengths, improvement areas, follow-up notes, and action items for
                                    structured employee growth.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Employee</div>
                                <div className="mt-1 font-semibold text-foreground">
                                    {appraisal.employee_name_snapshot}
                                </div>
                            </div>

                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Cycle</div>
                                <div className="mt-1 font-semibold text-foreground">
                                    {appraisal.cycle_name_snapshot}
                                </div>
                            </div>

                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Actions</div>
                                <div className="mt-1 font-semibold text-foreground">{data.actions.length}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <ClipboardList className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Strengths & Gaps</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Record demonstrated strengths and targeted improvement areas from the review
                                discussion.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Target className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Action Tracking</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Assign owners, due dates, and action statuses without changing your current workflow.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <FileText className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Follow-up Notes</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Keep supporting notes and follow-up commentary alongside the plan for future check-ins.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="border-b bg-muted/20">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle className="text-lg">Development Plan Editor</CardTitle>
                                <CardDescription>
                                    Update plan details and save changes when you are ready.
                                </CardDescription>
                            </div>

                            <Badge variant="outline">{data.actions.length} action item(s)</Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6 p-6">
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

                        <div className="flex justify-end border-t pt-4">
                            <Button
                                type="button"
                                onClick={() => put(route('performance.development_plans.update', appraisal.id))}
                                disabled={processing}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Save Development Plan
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PerformancePage>
    );
}