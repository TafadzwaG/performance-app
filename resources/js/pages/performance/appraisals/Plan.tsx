import AppraisalWorkflowJourneyCard from '@/components/performance/AppraisalWorkflowJourneyCard';
import AppraisalWorkspaceChrome from '@/components/performance/AppraisalWorkspaceChrome';
import GoalLibraryPicker from '@/components/performance/GoalLibraryPicker';
import ObjectiveTable from '@/components/performance/ObjectiveTable';
import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { Appraisal, GoalLibraryItem, Objective, Option } from '@/types/performance';
import { useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, BookOpen, ListChecks, Loader2, Save, Send, Target, TrendingUp } from 'lucide-react';
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
    const { auth } = usePage<SharedData>().props;
    const [pickerOpen, setPickerOpen] = useState(false);
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
    const managerEditingExistingGoals = abilities.plan && !isEmployeePlanningOwnAppraisal && objectiveCount > 0;
    const canStructurallyEditGoals = !managerEditingExistingGoals;
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
        setData(
            'objectives',
            data.objectives.filter((_, itemIndex) => itemIndex !== index),
        );
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
                canStructurallyEditGoals ? (
                    <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Pick from Goal Library
                    </Button>
                ) : undefined
            }
        >
            <AppraisalWorkspaceChrome
                appraisal={appraisal}
                title="Goal Planning"
                description="Use this workspace to agree SMART objectives, structure weighting, and prepare the appraisal for self assessment."
                badgeLabel="Goal Planning Workspace"
                badgeIcon={BookOpen}
                canEditGoals={abilities.plan}
                draftTag={draftSaved ? 'Saved as draft' : null}
            />

            <div className="grid gap-6 xl:grid-cols-12">
                <div className="space-y-6 xl:col-span-8">
                    <Card className="border-0 shadow-md">
                        <CardHeader
                            className="bg-muted/20 border-b pb-3"
                            style={{
                                margin: '10px',
                            }}
                        >
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ListChecks className="h-4.5 w-4.5" />
                                Planning Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <SummaryBlock label="Objectives" value={String(objectiveCount)} />
                            <SummaryBlock label="In Score" value={String(includedInScoreCount)} />
                            <SummaryBlock label="Total Weight" value={`${totalWeight}%`} />
                            <SummaryBlock label="Empty Titles" value={String(emptyTitleCount)} />
                        </CardContent>
                    </Card>

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
                            <ObjectiveTable
                                objectives={data.objectives as unknown as Objective[]}
                                mode="plan"
                                perspectiveOptions={perspectiveOptions}
                                goalLibraryItems={goalLibraryItems}
                                allowStructuralEditing={canStructurallyEditGoals}
                                onChange={updateObjective}
                                onAdd={canStructurallyEditGoals ? addObjective : undefined}
                                onRemove={canStructurallyEditGoals ? removeObjective : undefined}
                            />
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
                                    disabled={processing}
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
                                    disabled={processing || hasWeightIssue || objectiveCount === 0 || emptyTitleCount > 0}
                                    aria-busy={processing}
                                >
                                    {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    {processing ? 'Submitting…' : 'Save and Submit'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6 xl:col-span-4">
                    <AppraisalWorkflowJourneyCard
                        appraisalId={appraisal.id}
                        status={appraisal.status}
                        reopenedStage={appraisal.reopened_stage}
                        stageAccess={{
                            goal_setting: abilities.plan,
                            self_assessment_pending: abilities.selfAssess,
                            manager_review_pending: abilities.managerReview,
                            approval_pending: abilities.approve,
                            calibration_pending: abilities.calibrate,
                            finalized: abilities.finalize,
                        }}
                    />

                    <Card className="border-0 shadow-md">
                        <CardHeader
                            className="bg-muted/20 border-b pb-3"
                            style={{
                                margin: '10px',
                            }}
                        >
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
            </div>

            {canStructurallyEditGoals ? (
                <GoalLibraryPicker items={goalLibraryItems} open={pickerOpen} onOpenChange={setPickerOpen} onPick={selectLibraryGoal} />
            ) : null}
        </PerformancePage>
    );
}

function SummaryBlock({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-muted/20 rounded-lg border p-3">
            <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">{label}</div>
            <div className="font-display text-foreground mt-1 text-xl leading-tight font-light tracking-tight">{value}</div>
        </div>
    );
}
