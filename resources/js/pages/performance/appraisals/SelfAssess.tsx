import AppraisalSteps, { AppraisalStepSubmitActions } from '@/components/performance/AppraisalSteps';
import SelfAssessmentNotesPanel from '@/components/performance/SelfAssessmentNotesPanel';
import ObjectiveTable from '@/components/performance/ObjectiveTable';
import PerformancePage from '@/components/performance/PerformancePage';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { Appraisal, Objective, Option } from '@/types/performance';
import { useForm, router, usePage } from '@inertiajs/react';
import { AlertTriangle, ClipboardCheck, MessageSquareMore, Save, Send, Star, Target } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
    appraisal: Appraisal;
    abilities: Record<string, boolean>;
}

type SelfAssessmentIssue = {
    key: string;
    title: string;
    missingAchievement: boolean;
    missingSelfRating: boolean;
    instruction: string;
};

const breadcrumbs = (appraisal: Appraisal): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Appraisals', href: route('performance.appraisals.index') },
    { title: appraisal.employee_name_snapshot, href: route('performance.appraisals.show', appraisal.id) },
    { title: 'Self Assessment', href: route('performance.appraisals.self_assessment', appraisal.id) },
];

export default function SelfAssessment({ appraisal, abilities }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [draftSaved, setDraftSaved] = useState(false);
    const [submitAlertOpen, setSubmitAlertOpen] = useState(false);
    const [validationIssues, setValidationIssues] = useState<SelfAssessmentIssue[]>([]);
    const achievementNote = appraisal.comments?.find((comment) => comment.comment_type === 'achievement_note')?.body ?? '';
    const significantIssue = appraisal.comments?.find((comment) => comment.comment_type === 'significant_issue')?.body ?? '';
    const objectiveLevels = appraisal.template?.objective_rating_scale?.levels ?? [];
    const hasGoals = (appraisal.objectives ?? []).length > 0;
    const canOpenDevelopmentPlan =
        auth.permissions.includes('performance.development_plans.view') || auth.permissions.includes('performance.development_plans.update');
    const canEditSelfAssessment = Boolean(abilities.selfAssessEdit);
    const perspectiveOptions: Option[] = (appraisal.objectives ?? []).map((objective) => ({
        value: objective.perspective_id,
        label: objective.perspective?.name ?? `Perspective ${objective.perspective_id}`,
    }));

    const { data, setData, put, post, processing } = useForm({
        objectives:
            appraisal.objectives?.map((objective) => ({
                id: objective.id,
                performance_achieved: objective.performance_achieved ?? '',
                self_rating_scale_level_id: objective.self_rating_scale_level_id ?? '',
                employee_comment: objective.employee_comment ?? '',
            })) ?? [],
        achievement_note: achievementNote,
        significant_issue: significantIssue,
    });
    const hydratedFromStorage = useRef(false);
    const draftStorageKey = useMemo(() => `performance:appraisals:self-assessment:draft:${appraisal.id}`, [appraisal.id]);
    const initialDraftSnapshot = useMemo(
        () =>
            JSON.stringify({
                objectives:
                    appraisal.objectives?.map((objective) => ({
                        id: objective.id,
                        performance_achieved: objective.performance_achieved ?? '',
                        self_rating_scale_level_id: objective.self_rating_scale_level_id ?? '',
                        employee_comment: objective.employee_comment ?? '',
                    })) ?? [],
                achievement_note: achievementNote,
                significant_issue: significantIssue,
            }),
        [achievementNote, appraisal.objectives, significantIssue],
    );

    useEffect(() => {
        if (typeof window === 'undefined' || hydratedFromStorage.current) return;
        const raw = window.localStorage.getItem(draftStorageKey);
        if (!raw) {
            hydratedFromStorage.current = true;
            return;
        }
        try {
            const parsed = JSON.parse(raw) as Partial<typeof data>;
            (Object.keys(parsed) as Array<keyof typeof data>).forEach((key) => {
                const value = parsed[key];
                if (value !== undefined) setData(key, value);
            });
            setDraftSaved(true);
        } catch {
            window.localStorage.removeItem(draftStorageKey);
        } finally {
            hydratedFromStorage.current = true;
        }
    }, [draftStorageKey, setData]);

    useEffect(() => {
        if (typeof window === 'undefined' || !hydratedFromStorage.current) return;
        const serialized = JSON.stringify(data);
        if (serialized === initialDraftSnapshot) {
            window.localStorage.removeItem(draftStorageKey);
            setDraftSaved(false);
            return;
        }
        window.localStorage.setItem(draftStorageKey, serialized);
        setDraftSaved(true);
    }, [data, draftStorageKey, initialDraftSnapshot]);

    const updateObjective = (index: number, field: string, value: string | number | boolean | null) => {
        const next = [...data.objectives];
        next[index] = { ...next[index], [field]: value };
        setData('objectives', next);
    };

    const getSelfAssessmentIssues = (): SelfAssessmentIssue[] => {
        if (data.objectives.length === 0) {
            return [
                {
                    key: 'objectives-empty',
                    title: 'Objectives',
                    missingAchievement: true,
                    missingSelfRating: true,
                    instruction: 'This appraisal needs at least one objective before self assessment can be submitted.',
                },
            ];
        }

        return data.objectives
            .map((objective, index) => {
                const sourceObjective = (appraisal.objectives ?? [])[index];
                const title = sourceObjective?.title?.trim() || `Objective ${index + 1}`;
                const missingAchievement = !String(objective.performance_achieved ?? '').trim();
                const missingSelfRating = isEmptySelection(objective.self_rating_scale_level_id);

                if (!missingAchievement && !missingSelfRating) {
                    return null;
                }

                return {
                    key: `objective-${objective.id}`,
                    title,
                    missingAchievement,
                    missingSelfRating,
                    instruction: buildSelfAssessmentInstruction(missingAchievement, missingSelfRating),
                };
            })
            .filter((issue): issue is SelfAssessmentIssue => issue !== null);
    };

    const handleSaveAndSubmit = () => {
        const issues = getSelfAssessmentIssues();

        if (issues.length > 0) {
            setValidationIssues(issues);
            setSubmitAlertOpen(true);
            return;
        }

        put(route('performance.appraisals.self_assessment.update', appraisal.id), {
            onSuccess: () =>
                post(route('performance.appraisals.self_assessment.submit', appraisal.id), {
                    onSuccess: () => {
                        if (typeof window !== 'undefined') {
                            window.localStorage.removeItem(draftStorageKey);
                        }
                        setDraftSaved(false);
                        router.visit(route('performance.appraisals.show', appraisal.id));
                    },
                }),
        });
    };

    return (
        <PerformancePage
            title="Self Assessment"
            description="Record achievements, evidence, self-ratings, and commentary."
            breadcrumbs={breadcrumbs(appraisal)}
        >
            <AppraisalSteps
                appraisal={appraisal}
                abilities={abilities}
                hasGoals={hasGoals}
                canOpenDevelopmentPlan={canOpenDevelopmentPlan}
                currentStepKey="self_assessment"
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
                        <CardContent>
                            <ObjectiveTable
                                appraisalId={appraisal.id}
                                objectives={
                                    (appraisal.objectives ?? []).map((objective, index) => ({
                                        ...objective,
                                        performance_achieved: data.objectives[index]?.performance_achieved ?? '',
                                        self_rating_scale_level_id:
                                            Number(data.objectives[index]?.self_rating_scale_level_id ?? objective.self_rating_scale_level_id ?? 0) ||
                                            null,
                                        employee_comment: data.objectives[index]?.employee_comment ?? '',
                                    })) as Objective[]
                                }
                                mode="self"
                                perspectiveOptions={perspectiveOptions}
                                ratingLevels={objectiveLevels}
                                onChange={canEditSelfAssessment ? updateObjective : undefined}
                            />
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md">
                        <CardHeader className="border-b bg-muted/20">
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquareMore className="h-4.5 w-4.5" />
                                Comments & Notes
                            </CardTitle>
                            <CardDescription>
                                Capture achievements and issues beyond your objectives. Both fields are optional and save with your draft.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-5">
                            <SelfAssessmentNotesPanel
                                comments={appraisal.comments ?? []}
                                achievementNote={data.achievement_note}
                                significantIssue={data.significant_issue}
                                onAchievementChange={canEditSelfAssessment ? (value) => setData('achievement_note', value) : undefined}
                                onIssueChange={canEditSelfAssessment ? (value) => setData('significant_issue', value) : undefined}
                                editable={canEditSelfAssessment}
                            />
                        </CardContent>
                    </Card>

                    <AppraisalStepSubmitActions
                        stepKey="self_assessment"
                        appraisal={appraisal}
                        abilities={abilities}
                        hasGoals={hasGoals}
                        canOpenDevelopmentPlan={canOpenDevelopmentPlan}
                    >
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                onClick={() =>
                                    put(route('performance.appraisals.self_assessment.update', appraisal.id), {
                                        onSuccess: () => setDraftSaved(true),
                                    })
                                }
                                disabled={processing}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Save Draft
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleSaveAndSubmit}
                                disabled={processing}
                            >
                                <Send className="mr-2 h-4 w-4" />
                                Save and Submit
                            </Button>
                        </div>
                    </AppraisalStepSubmitActions>
                </div>
            </div>

            <AlertDialog open={submitAlertOpen} onOpenChange={setSubmitAlertOpen}>
                <AlertDialogContent className="w-[min(96vw,56rem)] max-w-[min(96vw,56rem)]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-left">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                            Self assessment is incomplete
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-4 text-left">
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 rounded-full bg-white p-2 shadow-sm">
                                            <ClipboardCheck className="h-4 w-4 text-amber-700" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-amber-900">Complete the required self-assessment fields before submitting.</p>
                                            <p className="text-sm text-amber-800">
                                                Each objective needs performance achieved text and a self rating. You can still save an incomplete draft.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="gap-1.5 px-3 py-1">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        {validationIssues.length} objective{validationIssues.length === 1 ? '' : 's'} need attention
                                    </Badge>
                                    <Badge variant="outline" className="gap-1.5 border-rose-200 bg-rose-50 px-3 py-1 text-rose-700">
                                        <MessageSquareMore className="h-3.5 w-3.5" />
                                        Missing performance achieved
                                    </Badge>
                                    <Badge variant="outline" className="gap-1.5 border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                                        <Star className="h-3.5 w-3.5" />
                                        Missing self rating
                                    </Badge>
                                </div>

                                <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
                                    {validationIssues.map((issue) => (
                                        <div key={issue.key} className="rounded-2xl border bg-background p-4 shadow-sm">
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-semibold text-foreground">{issue.title}</p>
                                                    {issue.missingAchievement ? (
                                                        <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                                                            Performance achieved missing
                                                        </Badge>
                                                    ) : null}
                                                    {issue.missingSelfRating ? (
                                                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                                                            Self rating missing
                                                        </Badge>
                                                    ) : null}
                                                </div>

                                                <div className="flex items-start gap-2 rounded-xl border border-dashed bg-muted/20 px-3 py-2">
                                                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                                                    <p className="text-sm text-muted-foreground">{issue.instruction}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Back to self assessment</AlertDialogCancel>
                        <AlertDialogAction onClick={() => setSubmitAlertOpen(false)}>Continue editing</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PerformancePage>
    );
}

function isEmptySelection(value: unknown) {
    if (value === null || value === undefined) return true;

    const normalized = String(value).trim();
    return normalized === '' || normalized === '0';
}

function buildSelfAssessmentInstruction(missingAchievement: boolean, missingSelfRating: boolean) {
    if (missingAchievement && missingSelfRating) {
        return 'Add what was achieved and select a self rating before submitting this objective.';
    }

    if (missingAchievement) {
        return 'Add what was achieved before submitting this objective.';
    }

    return 'Select a self rating before submitting this objective.';
}
