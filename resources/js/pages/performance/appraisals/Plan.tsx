import AppraisalHeader from '@/components/performance/AppraisalHeader';
import GoalLibraryPicker from '@/components/performance/GoalLibraryPicker';
import ObjectiveTable from '@/components/performance/ObjectiveTable';
import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal, GoalLibraryItem, Objective, Option } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    appraisal: Appraisal;
    perspectiveOptions: Option[];
    goalLibraryItems: GoalLibraryItem[];
}

interface PlanObjective {
    id?: number;
    perspective_id: number;
    goal_library_item_id: number | null;
    objective_type: string;
    title: string;
    kpi_measure: string;
    target_definition: string;
    weight: number;
    evidence_source: string;
    due_date: string;
    include_in_business_score: boolean;
    [key: string]: boolean | number | string | null | undefined;
}

const breadcrumbs = (appraisal: Appraisal): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Appraisals', href: route('performance.appraisals.index') },
    { title: appraisal.employee_name_snapshot, href: route('performance.appraisals.show', appraisal.id) },
    { title: 'Plan', href: route('performance.appraisals.plan', appraisal.id) },
];

export default function AppraisalPlan({ appraisal, perspectiveOptions, goalLibraryItems }: Props) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const { data, setData, put, post, processing } = useForm<{ objectives: PlanObjective[] }>({
        objectives:
            appraisal.objectives?.map((objective) => ({
                id: objective.id,
                perspective_id: objective.perspective_id,
                goal_library_item_id: objective.goal_library_item_id ?? null,
                objective_type: objective.objective_type ?? 'business',
                title: objective.title,
                kpi_measure: objective.kpi_measure ?? '',
                target_definition: objective.target_definition ?? '',
                weight: objective.weight,
                evidence_source: objective.evidence_source ?? '',
                due_date: objective.due_date ?? '',
                include_in_business_score: objective.include_in_business_score,
            })) ?? [],
    });

    const updateObjective = (index: number, field: string, value: string | number | boolean | null) => {
        const next = [...data.objectives];
        next[index] = { ...next[index], [field]: value };
        setData('objectives', next);
    };

    const addObjective = () => {
        setData('objectives', [
            ...data.objectives,
            {
                perspective_id: Number(perspectiveOptions[0]?.value ?? 0),
                goal_library_item_id: null,
                objective_type: 'business',
                title: '',
                kpi_measure: '',
                target_definition: '',
                weight: 0,
                evidence_source: '',
                due_date: '',
                include_in_business_score: true,
            },
        ]);
    };

    const removeObjective = (index: number) => {
        setData('objectives', data.objectives.filter((_, itemIndex) => itemIndex !== index));
    };

    const selectLibraryGoal = (item: GoalLibraryItem) => {
        setData('objectives', [
            ...data.objectives,
            {
                perspective_id: item.perspective_id,
                goal_library_item_id: item.id,
                objective_type: 'business',
                title: item.title,
                kpi_measure: item.kpi_measure ?? '',
                target_definition: item.target_definition ?? '',
                weight: item.default_weight ?? 0,
                evidence_source: item.evidence_source ?? '',
                due_date: '',
                include_in_business_score: true,
            },
        ]);
    };

    return (
        <PerformancePage
            title="Goal Planning"
            description="Define SMART objectives, measures, targets, and weights for the cycle."
            breadcrumbs={breadcrumbs(appraisal)}
            secondaryActions={
                <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
                    Pick from Goal Library
                </Button>
            }
        >
            <AppraisalHeader appraisal={appraisal} />
            <Card>
                <CardHeader>
                    <CardTitle>Objectives</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ObjectiveTable
                        objectives={data.objectives as unknown as Objective[]}
                        mode="plan"
                        perspectiveOptions={perspectiveOptions}
                        goalLibraryItems={goalLibraryItems}
                        onChange={updateObjective}
                        onAdd={addObjective}
                        onRemove={removeObjective}
                    />
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" onClick={() => put(route('performance.appraisals.plan.update', appraisal.id))} disabled={processing}>
                            Save Plan
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                put(route('performance.appraisals.plan.update', appraisal.id), {
                                    onSuccess: () => post(route('performance.appraisals.plan.submit', appraisal.id)),
                                })
                            }
                            disabled={processing}
                        >
                            Save and Submit
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <GoalLibraryPicker items={goalLibraryItems} open={pickerOpen} onOpenChange={setPickerOpen} onPick={selectLibraryGoal} />
        </PerformancePage>
    );
}
