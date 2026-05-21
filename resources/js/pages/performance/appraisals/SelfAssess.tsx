import AppraisalSteps, { AppraisalStepSubmitActions } from '@/components/performance/AppraisalSteps';
import SelfAssessmentNotesPanel from '@/components/performance/SelfAssessmentNotesPanel';
import ObjectiveTable from '@/components/performance/ObjectiveTable';
import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { Appraisal, Objective, Option } from '@/types/performance';
import { useForm, usePage } from '@inertiajs/react';
import { MessageSquareMore, Save, Send, Target } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
    appraisal: Appraisal;
    abilities: Record<string, boolean>;
}

const breadcrumbs = (appraisal: Appraisal): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Appraisals', href: route('performance.appraisals.index') },
    { title: appraisal.employee_name_snapshot, href: route('performance.appraisals.show', appraisal.id) },
    { title: 'Self Assessment', href: route('performance.appraisals.self_assessment', appraisal.id) },
];

export default function SelfAssessment({ appraisal, abilities }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [draftSaved, setDraftSaved] = useState(false);
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
                                onClick={() =>
                                    put(route('performance.appraisals.self_assessment.update', appraisal.id), {
                                        onSuccess: () =>
                                            post(route('performance.appraisals.self_assessment.submit', appraisal.id), {
                                                onSuccess: () => {
                                                    if (typeof window !== 'undefined') {
                                                        window.localStorage.removeItem(draftStorageKey);
                                                    }
                                                    setDraftSaved(false);
                                                },
                                            }),
                                    })
                                }
                                disabled={processing}
                            >
                                <Send className="mr-2 h-4 w-4" />
                                Save and Submit
                            </Button>
                        </div>
                    </AppraisalStepSubmitActions>
                </div>
            </div>
        </PerformancePage>
    );
}
