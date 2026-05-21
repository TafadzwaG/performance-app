import AppraisalWorkspaceChrome from '@/components/performance/AppraisalWorkspaceChrome';
import AppraisalWorkflowJourneyCard from '@/components/performance/AppraisalWorkflowJourneyCard';
import CommentPanel from '@/components/performance/CommentPanel';
import ObjectiveTable from '@/components/performance/ObjectiveTable';
import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal, Objective, Option } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import { ClipboardCheck, MessageSquareMore, Save, Send, Target } from 'lucide-react';
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
    const [draftSaved, setDraftSaved] = useState(false);
    const achievementNote = appraisal.comments?.find((comment) => comment.comment_type === 'achievement_note')?.body ?? '';
    const significantIssue = appraisal.comments?.find((comment) => comment.comment_type === 'significant_issue')?.body ?? '';
    const objectiveLevels = appraisal.template?.objective_rating_scale?.levels ?? [];
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
        <PerformancePage title="Self Assessment" description="Record achievements, evidence, self-ratings, and commentary." breadcrumbs={breadcrumbs(appraisal)}>
            <AppraisalWorkspaceChrome
                appraisal={appraisal}
                title="Self Assessment"
                description="Use this workspace to document outcomes against agreed goals, add evidence-backed commentary, and submit your self assessment."
                badgeLabel="Self Assessment Workspace"
                badgeIcon={ClipboardCheck}
                canEditGoals={abilities.plan}
                draftTag={draftSaved ? 'Saved as draft' : null}
            />

            <div className="grid gap-6 xl:grid-cols-12">
                <div className="space-y-6 xl:col-span-8">
                    <Card className="border-0 shadow-md">
                        <CardHeader className="border-b bg-muted/20" style={{
                            margin: '10px'
                        }}>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-4.5 w-4.5" />
                                Objectives
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ObjectiveTable
                                appraisalId={appraisal.id}
                                objectives={(appraisal.objectives ?? []).map((objective, index) => ({
                                    ...objective,
                                    performance_achieved: data.objectives[index]?.performance_achieved ?? '',
                                    self_rating_scale_level_id:
                                        Number(data.objectives[index]?.self_rating_scale_level_id ?? objective.self_rating_scale_level_id ?? 0) || null,
                                    employee_comment: data.objectives[index]?.employee_comment ?? '',
                                })) as Objective[]}
                                mode="self"
                                perspectiveOptions={perspectiveOptions}
                                ratingLevels={objectiveLevels}
                                onChange={updateObjective}
                            />
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md">
                        <CardHeader className="border-b bg-muted/20" style={{
                            margin: '10px'
                        }}>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquareMore className="h-4.5 w-4.5" />
                                Comments & Notes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CommentPanel
                                comments={appraisal.comments ?? []}
                                achievementNote={data.achievement_note}
                                significantIssue={data.significant_issue}
                                onAchievementChange={(value) => setData('achievement_note', value)}
                                onIssueChange={(value) => setData('significant_issue', value)}
                                editable
                            />
                        </CardContent>
                    </Card>

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
                </div>
            </div>
        </PerformancePage>
    );
}
