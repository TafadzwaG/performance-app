import AppraisalHeader from '@/components/performance/AppraisalHeader';
import AppraisalWorkflowStepper from '@/components/performance/AppraisalWorkflowStepper';
import CompetencyRatingTable from '@/components/performance/CompetencyRatingTable';
import ObjectiveTable from '@/components/performance/ObjectiveTable';
import PerformancePage from '@/components/performance/PerformancePage';
import ScoreSummaryCard from '@/components/performance/ScoreSummaryCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal, CompetencyRating, Objective, Option } from '@/types/performance';
import { router, useForm } from '@inertiajs/react';
import { Calculator, ClipboardList, CornerUpLeft, Save, Send, ShieldCheck, Target, Trophy, Workflow } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';

interface Props {
    appraisal: Appraisal;
    abilities: Record<string, boolean>;
}

const breadcrumbs = (appraisal: Appraisal): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Appraisals', href: route('performance.appraisals.index') },
    { title: appraisal.employee_name_snapshot, href: route('performance.appraisals.show', appraisal.id) },
    { title: 'Manager Review', href: route('performance.appraisals.manager_review', appraisal.id) },
];

export default function ManagerReview({ appraisal, abilities }: Props) {
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
                manager_rating_scale_level_id: objective.manager_rating_scale_level_id ?? '',
                manager_comment: objective.manager_comment ?? '',
            })) ?? [],
        competency_ratings:
            appraisal.competency_ratings?.map((rating) => ({
                id: rating.id,
                manager_rating_scale_level_id: rating.manager_rating_scale_level_id ?? '',
                manager_comment: rating.manager_comment ?? '',
            })) ?? [],
        comment: '',
    });
    const hydratedFromStorage = useRef(false);
    const draftStorageKey = useMemo(() => `performance:appraisals:manager-review:draft:${appraisal.id}`, [appraisal.id]);

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
        <PerformancePage title="Manager Review" description="Review self-assessment responses, rate performance, and submit to approval." breadcrumbs={breadcrumbs(appraisal)}>
            <Card className="border shadow-sm">
                <CardContent className="space-y-4 p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ClipboardList className="h-4 w-4" />
                            Manager Review Workspace
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
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Trophy className="h-4.5 w-4.5" />
                        Score Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ScoreSummaryCard
                        businessScore={appraisal.business_score}
                        valuesScore={appraisal.values_score}
                        overallScore={appraisal.overall_score}
                        overallRating={appraisal.overall_rating_level?.label ?? null}
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
                            manager_rating_scale_level_id: Number(data.objectives[index]?.manager_rating_scale_level_id ?? objective.manager_rating_scale_level_id ?? 0) || null,
                            manager_comment: data.objectives[index]?.manager_comment ?? '',
                        })) as Objective[]}
                        mode="manager"
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
                            manager_rating_scale_level_id: Number(data.competency_ratings[index]?.manager_rating_scale_level_id ?? rating.manager_rating_scale_level_id ?? 0) || null,
                            manager_comment: data.competency_ratings[index]?.manager_comment ?? '',
                        })) as CompetencyRating[]}
                        mode="manager"
                        ratingLevels={competencyLevels}
                        onChange={updateRating}
                    />
                </CardContent>
            </Card>

            <Card className="border shadow-sm">
                <CardHeader>
                    <CardTitle>Overall Manager Comment</CardTitle>
                </CardHeader>
                <CardContent>
                    <textarea className="min-h-32 w-full rounded-md border bg-background px-3 py-2" value={data.comment} onChange={(event) => setData('comment', event.target.value)} />
                </CardContent>
            </Card>

            <div className="flex flex-wrap gap-2">
                {abilities.managerReview ? (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.post(route('performance.appraisals.manager_review.recalculate_score', appraisal.id))}
                        disabled={processing}
                    >
                        <Calculator className="mr-2 h-4 w-4" />
                        Re-Calculate Score
                    </Button>
                ) : null}
                <Button type="button" onClick={() => put(route('performance.appraisals.manager_review.update', appraisal.id))} disabled={processing}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Review
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                        put(route('performance.appraisals.manager_review.update', appraisal.id), {
                            onSuccess: () =>
                                post(route('performance.appraisals.manager_review.submit', appraisal.id), {
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
                    Submit Forward
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                        router.post(route('performance.appraisals.manager_review.send_back', appraisal.id), {
                            reason: 'Returned to employee for updates.',
                            reopened_stage: 'self_assessment',
                        })
                    }
                    disabled={processing}
                >
                    <CornerUpLeft className="mr-2 h-4 w-4" />
                    Send Back
                </Button>
            </div>
        </PerformancePage>
    );
}
