import AppraisalHeader from '@/components/performance/AppraisalHeader';
import AppraisalWorkflowStepper from '@/components/performance/AppraisalWorkflowStepper';
import GoalLibraryPicker from '@/components/performance/GoalLibraryPicker';
import ObjectiveTable from '@/components/performance/ObjectiveTable';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal, GoalLibraryItem, Objective, Option } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import { AlertTriangle, BookOpen, ClipboardList, ListChecks, Loader2, Save, Send, Target, TrendingUp, Workflow } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
    appraisal: Appraisal;
    abilities: Record<string, boolean>;
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

export default function AppraisalPlan({ appraisal, abilities, perspectiveOptions, goalLibraryItems }: Props) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const hydratedFromStorage = useRef(false);
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
    const draftStorageKey = useMemo(() => `performance:appraisals:plan:draft:${appraisal.id}`, [appraisal.id]);

    useEffect(() => {
        if (typeof window === 'undefined' || hydratedFromStorage.current) {
            return;
        }

        const raw = window.localStorage.getItem(draftStorageKey);
        if (!raw) {
            hydratedFromStorage.current = true;
            return;
        }

        try {
            const parsed = JSON.parse(raw) as { objectives?: PlanObjective[] } | PlanObjective[];
            const objectives = Array.isArray(parsed) ? parsed : parsed.objectives;

            if (Array.isArray(objectives)) {
                setData('objectives', objectives);
            }
        } catch {
            window.localStorage.removeItem(draftStorageKey);
        } finally {
            hydratedFromStorage.current = true;
        }
    }, [draftStorageKey, setData]);

    useEffect(() => {
        if (typeof window === 'undefined' || !hydratedFromStorage.current) {
            return;
        }

        window.localStorage.setItem(draftStorageKey, JSON.stringify({ objectives: data.objectives }));
    }, [data.objectives, draftStorageKey]);
    const objectiveCount = data.objectives.length;
    const includedInScoreCount = data.objectives.filter((objective) => objective.include_in_business_score).length;
    const totalWeight = data.objectives.reduce((sum, objective) => sum + Number(objective.weight || 0), 0);
    const weightDelta = 100 - totalWeight;
    const hasWeightIssue = weightDelta !== 0;
    const emptyTitleCount = data.objectives.filter((objective) => !objective.title.trim()).length;

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
                    <BookOpen className="mr-2 h-4 w-4" />
                    Pick from Goal Library
                </Button>
            }
        >
            <Card className="border shadow-sm">
                <CardContent className="space-y-4 p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ClipboardList className="h-4 w-4" />
                            Planning Workspace
                        </div>
                        <Badge variant="secondary">Appraisal #{appraisal.id}</Badge>
                    </div>
                    <AppraisalHeader appraisal={appraisal} />
                </CardContent>
            </Card>

            <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Workflow className="h-4.5 w-4.5" />
                        Workflow Stage
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <AppraisalWorkflowStepper
                        status={appraisal.status}
                        appraisalId={appraisal.id}
                        reopenedStage={appraisal.reopened_stage}
                        stageAccess={{
                            goal_setting: abilities.plan,
                            self_assessment_pending: abilities.selfAssess,
                            manager_review_pending: abilities.managerReview,
                            approval_pending: abilities.approve,
                            approved: true,
                            finalized: abilities.finalize,
                        }}
                    />
                </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-12">
                <Card className="border shadow-sm lg:col-span-8">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ListChecks className="h-4.5 w-4.5" />
                            Planning Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border bg-muted/20 p-3">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">Objectives</div>
                            <div className="mt-1 text-xl font-semibold text-foreground">{objectiveCount}</div>
                        </div>
                        <div className="rounded-lg border bg-muted/20 p-3">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">In Score</div>
                            <div className="mt-1 text-xl font-semibold text-foreground">{includedInScoreCount}</div>
                        </div>
                        <div className="rounded-lg border bg-muted/20 p-3">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">Total Weight</div>
                            <div className="mt-1 text-xl font-semibold text-foreground">{totalWeight}%</div>
                        </div>
                        <div className="rounded-lg border bg-muted/20 p-3">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">Empty Titles</div>
                            <div className="mt-1 text-xl font-semibold text-foreground">{emptyTitleCount}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm lg:col-span-4">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <TrendingUp className="h-4.5 w-4.5" />
                            Weight Rule
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {hasWeightIssue ? (
                            <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                                <div className="flex items-center gap-2 font-medium">
                                    <AlertTriangle className="h-4 w-4" />
                                    Weights must total 100%
                                </div>
                                <div className="mt-2">
                                    Current total is <span className="font-semibold">{totalWeight}%</span>.
                                    {weightDelta > 0 ? ` Add ${weightDelta}% more.` : ` Reduce by ${Math.abs(weightDelta)}%.`}
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
                                Objective weights are valid at 100%.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="border shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-4.5 w-4.5" />
                        Objectives
                    </CardTitle>
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
                        <Button
                            type="button"
                            onClick={() =>
                                put(route('performance.appraisals.plan.update', appraisal.id), {
                                    onSuccess: () => {
                                        if (typeof window !== 'undefined') {
                                            window.localStorage.setItem(
                                                draftStorageKey,
                                                JSON.stringify({ objectives: data.objectives }),
                                            );
                                        }
                                    },
                                })
                            }
                            disabled={processing}
                            aria-busy={processing}
                        >
                            {processing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                            )}
                            {processing ? 'Saving…' : 'Save Plan'}
                        </Button>
                        <Button
                            type="button"
                            className="bg-emerald-700 text-white hover:bg-emerald-800"
                            onClick={() =>
                                put(route('performance.appraisals.plan.update', appraisal.id), {
                                    onSuccess: () =>
                                        post(route('performance.appraisals.plan.submit', appraisal.id), {
                                            onSuccess: () => {
                                                if (typeof window !== 'undefined') {
                                                    window.localStorage.removeItem(draftStorageKey);
                                                }
                                            },
                                        }),
                                })
                            }
                            disabled={processing || hasWeightIssue || objectiveCount === 0 || emptyTitleCount > 0}
                            aria-busy={processing}
                        >
                            {processing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                            )}
                            {processing ? 'Submitting…' : 'Save and Submit'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <GoalLibraryPicker items={goalLibraryItems} open={pickerOpen} onOpenChange={setPickerOpen} onPick={selectLibraryGoal} />
        </PerformancePage>
    );
}
