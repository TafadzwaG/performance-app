import AppraisalSteps, { AppraisalStepSubmitActions } from '@/components/performance/AppraisalSteps';
import ObjectiveTable from '@/components/performance/ObjectiveTable';
import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { Appraisal, GoalLibrarySearchOption, Objective, Option } from '@/types/performance';
import { useForm, usePage } from '@inertiajs/react';
import { Loader2, Save, Send, Target } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
    appraisal: Appraisal;
    abilities: Record<string, boolean>;
    perspectiveOptions: Option[];
    goalLibrarySearchEndpoint: string;
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

function createEmptyPlanObjective(perspectiveOptions: Option[]): PlanObjective {
    return {
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
    };
}

const breadcrumbs = (appraisal: Appraisal): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Appraisals', href: route('performance.appraisals.index') },
    { title: appraisal.employee_name_snapshot, href: route('performance.appraisals.show', appraisal.id) },
    { title: 'Plan', href: route('performance.appraisals.plan', appraisal.id) },
];

export default function AppraisalPlan({ appraisal, abilities, perspectiveOptions, goalLibrarySearchEndpoint }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [draftSaved, setDraftSaved] = useState(false);
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
    const initialDraftSnapshot = useMemo(
        () =>
            JSON.stringify({
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
            }),
        [appraisal.objectives],
    );

    useEffect(() => {
        if (typeof window === 'undefined' || hydratedFromStorage.current) return;
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
                setDraftSaved(true);
            }
        } catch {
            window.localStorage.removeItem(draftStorageKey);
        } finally {
            hydratedFromStorage.current = true;
        }
    }, [draftStorageKey, setData]);

    useEffect(() => {
        if (typeof window === 'undefined' || !hydratedFromStorage.current) return;
        const serialized = JSON.stringify({ objectives: data.objectives });
        if (serialized === initialDraftSnapshot) {
            window.localStorage.removeItem(draftStorageKey);
            setDraftSaved(false);
            return;
        }
        window.localStorage.setItem(draftStorageKey, serialized);
        setDraftSaved(true);
    }, [data.objectives, draftStorageKey, initialDraftSnapshot]);

    const objectiveCount = data.objectives.length;
    const isEmployeePlanningOwnAppraisal = auth.user.id === appraisal.employee_user_id;
    const hasGoals = (appraisal.objectives ?? []).length > 0;
    const canOpenDevelopmentPlan =
        auth.permissions.includes('performance.development_plans.view') || auth.permissions.includes('performance.development_plans.update');
    const managerEditingExistingGoals = abilities.planEdit && !isEmployeePlanningOwnAppraisal && objectiveCount > 0;
    const canStructurallyEditGoals = abilities.planEdit && !managerEditingExistingGoals;
    const totalWeight = data.objectives.reduce((sum, objective) => sum + Number(objective.weight || 0), 0);
    const weightDelta = 100 - totalWeight;
    const hasWeightIssue = weightDelta !== 0;
    const emptyTitleCount = data.objectives.filter((objective) => !objective.title.trim()).length;

    const updateObjective = (index: number, field: string, value: string | number | boolean | null) => {
        const next = [...data.objectives];
        next[index] = { ...next[index], [field]: value };
        setData('objectives', next);
    };

    const applyGoalLibraryToObjective = (index: number, goal: GoalLibrarySearchOption) => {
        const next = [...data.objectives];
        next[index] = {
            ...next[index],
            goal_library_item_id: goal.value,
            perspective_id: goal.perspective_id,
            title: goal.title,
            kpi_measure: goal.kpi_measure ?? '',
            target_definition: goal.target_definition ?? '',
            weight: goal.default_weight ?? next[index].weight,
            evidence_source: goal.evidence_source ?? '',
        };
        setData('objectives', next);
    };

    const addObjective = () => {
        setData('objectives', [...data.objectives, createEmptyPlanObjective(perspectiveOptions)]);
    };

    const removeObjective = (index: number) => {
        setData(
            'objectives',
            data.objectives.filter((_, itemIndex) => itemIndex !== index),
        );
    };

    return (
        <PerformancePage
            title="Goal Planning"
            description="Define SMART objectives, measures, targets, and weights for the cycle. Search the goal library matched to your department and job title."
            breadcrumbs={breadcrumbs(appraisal)}
        >
            <AppraisalSteps
                appraisal={appraisal}
                abilities={abilities}
                hasGoals={hasGoals}
                canOpenDevelopmentPlan={canOpenDevelopmentPlan}
                currentStepKey="goal_setting"
                showStartButton={false}
            />

            <div className="grid gap-6 xl:grid-cols-12">
                <div className="space-y-6 xl:col-span-12">
                    <Card className="border-0 shadow-md">
                        <CardHeader
                            className="bg-muted/20 border-b"
                            style={{
                                margin: '10px',
                            }}
                        >
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-4.5 w-4.5" />
                                Objectives
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
                                <span>
                                    <span className="font-medium text-foreground">{objectiveCount}</span> objectives
                                </span>
                                <span className={hasWeightIssue ? 'font-medium text-red-700' : 'font-medium text-emerald-800'}>
                                    Total weight: {totalWeight}%
                                    {hasWeightIssue ? ` — need ${weightDelta > 0 ? '+' : ''}${weightDelta}%` : ' — ready'}
                                </span>
                            </div>
                            <ObjectiveTable
                                objectives={data.objectives as unknown as Objective[]}
                                mode="plan"
                                perspectiveOptions={perspectiveOptions}
                                goalLibrarySearchEndpoint={canStructurallyEditGoals ? goalLibrarySearchEndpoint : undefined}
                                allowStructuralEditing={canStructurallyEditGoals}
                                onChange={updateObjective}
                                onApplyGoalLibrary={applyGoalLibraryToObjective}
                                onAdd={canStructurallyEditGoals ? addObjective : undefined}
                                onRemove={canStructurallyEditGoals ? removeObjective : undefined}
                            />
                            {hasWeightIssue ? (
                                <p className="text-sm text-red-700">
                                    Objective weights must total 100% (current total: {totalWeight}%).
                                </p>
                            ) : null}
                            <AppraisalStepSubmitActions
                                stepKey="goal_setting"
                                appraisal={appraisal}
                                abilities={abilities}
                                hasGoals={hasGoals}
                                canOpenDevelopmentPlan={canOpenDevelopmentPlan}
                            >
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        onClick={() =>
                                            put(route('performance.appraisals.plan.update', appraisal.id), {
                                                onSuccess: () => {
                                                    if (typeof window !== 'undefined') {
                                                        window.localStorage.setItem(draftStorageKey, JSON.stringify({ objectives: data.objectives }));
                                                    }
                                                    setDraftSaved(true);
                                                },
                                            })
                                        }
                                        disabled={processing || hasWeightIssue || objectiveCount === 0 || emptyTitleCount > 0}
                                        aria-busy={processing}
                                    >
                                        {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
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
                                                            setDraftSaved(false);
                                                        },
                                                    }),
                                            })
                                        }
                                        disabled={
                                            processing || hasWeightIssue || objectiveCount === 0 || emptyTitleCount > 0
                                        }
                                        aria-busy={processing}
                                    >
                                        {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                        {processing ? 'Submitting…' : 'Save and Submit'}
                                    </Button>
                                </div>
                            </AppraisalStepSubmitActions>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PerformancePage>
    );
}
