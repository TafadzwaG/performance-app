import AppraisalHeader from '@/components/performance/AppraisalHeader';
import AppraisalWorkflowStepper from '@/components/performance/AppraisalWorkflowStepper';
import CommentPanel from '@/components/performance/CommentPanel';
import CompetencyRatingTable from '@/components/performance/CompetencyRatingTable';
import ObjectiveTable from '@/components/performance/ObjectiveTable';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal, CompetencyRating, Objective, Option } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import { ClipboardList, MessageSquareMore, Save, Send, ShieldCheck, Target, Workflow } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';

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
    const achievementNote = appraisal.comments?.find((comment) => comment.comment_type === 'achievement_note')?.body ?? '';
    const significantIssue = appraisal.comments?.find((comment) => comment.comment_type === 'significant_issue')?.body ?? '';
    const objectiveLevels = appraisal.template?.objective_rating_scale?.levels ?? [];
    const competencyLevels = appraisal.template?.competency_rating_scale?.levels ?? [];
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
        competency_ratings:
            appraisal.competency_ratings?.map((rating) => ({
                id: rating.id,
                self_rating_scale_level_id: rating.self_rating_scale_level_id ?? '',
                employee_comment: rating.employee_comment ?? '',
            })) ?? [],
        achievement_note: achievementNote,
        significant_issue: significantIssue,
    });
    const hydratedFromStorage = useRef(false);
    const draftStorageKey = useMemo(() => `performance:appraisals:self-assessment:draft:${appraisal.id}`, [appraisal.id]);

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
            const parsed = JSON.parse(raw) as Partial<typeof data>;
            (Object.keys(parsed) as Array<keyof typeof data>).forEach((key) => {
                const value = parsed[key];
                if (value !== undefined) {
                    setData(key, value);
                }
            });
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

        window.localStorage.setItem(draftStorageKey, JSON.stringify(data));
    }, [data, draftStorageKey]);

    const updateObjective = (index: number, field: string, value: string | number | boolean | null) => {
        const next = [...data.objectives];
        next[index] = { ...next[index], [field]: value };
        setData('objectives', next);
    };

    const updateRating = (index: number, field: string, value: string | number | null) => {
        const next = [...data.competency_ratings];
        next[index] = { ...next[index], [field]: value };
        setData('competency_ratings', next);
    };

    return (
        <PerformancePage title="Self Assessment" description="Record achievements, evidence, self-ratings, and commentary." breadcrumbs={breadcrumbs(appraisal)}>
            <Card className="border shadow-sm">
                <CardContent className="space-y-4 p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ClipboardList className="h-4 w-4" />
                            Self Assessment Workspace
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

            <Card className="border shadow-sm">
                <CardHeader>
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
                            self_rating_scale_level_id: Number(data.objectives[index]?.self_rating_scale_level_id ?? objective.self_rating_scale_level_id ?? 0) || null,
                            employee_comment: data.objectives[index]?.employee_comment ?? '',
                        })) as Objective[]}
                        mode="self"
                        perspectiveOptions={perspectiveOptions}
                        ratingLevels={objectiveLevels}
                        onChange={updateObjective}
                    />
                </CardContent>
            </Card>

            <Card className="border shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-4.5 w-4.5" />
                        Competencies / Values
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <CompetencyRatingTable
                        ratings={(appraisal.competency_ratings ?? []).map((rating, index) => ({
                            ...rating,
                            self_rating_scale_level_id: Number(data.competency_ratings[index]?.self_rating_scale_level_id ?? rating.self_rating_scale_level_id ?? 0) || null,
                            employee_comment: data.competency_ratings[index]?.employee_comment ?? '',
                        })) as CompetencyRating[]}
                        mode="self"
                        ratingLevels={competencyLevels}
                        onChange={updateRating}
                    />
                </CardContent>
            </Card>

            <Card className="border shadow-sm">
                <CardHeader>
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
                <Button type="button" onClick={() => put(route('performance.appraisals.self_assessment.update', appraisal.id))} disabled={processing}>
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
        </PerformancePage>
    );
}
