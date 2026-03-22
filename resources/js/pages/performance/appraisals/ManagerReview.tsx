import AppraisalHeader from '@/components/performance/AppraisalHeader';
import CompetencyRatingTable from '@/components/performance/CompetencyRatingTable';
import ObjectiveTable from '@/components/performance/ObjectiveTable';
import PerformancePage from '@/components/performance/PerformancePage';
import ScoreSummaryCard from '@/components/performance/ScoreSummaryCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal, CompetencyRating, Objective, Option } from '@/types/performance';
import { router, useForm } from '@inertiajs/react';

interface Props {
    appraisal: Appraisal;
}

const breadcrumbs = (appraisal: Appraisal): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Appraisals', href: route('performance.appraisals.index') },
    { title: appraisal.employee_name_snapshot, href: route('performance.appraisals.show', appraisal.id) },
    { title: 'Manager Review', href: route('performance.appraisals.manager_review', appraisal.id) },
];

export default function ManagerReview({ appraisal }: Props) {
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
            <AppraisalHeader appraisal={appraisal} />
            <ScoreSummaryCard
                businessScore={appraisal.business_score}
                valuesScore={appraisal.values_score}
                overallScore={appraisal.overall_score}
                overallRating={appraisal.overall_rating_level?.label ?? null}
            />
            <Card>
                <CardHeader>
                    <CardTitle>Objectives</CardTitle>
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
            <Card>
                <CardHeader>
                    <CardTitle>Competencies / Values</CardTitle>
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
            <Card>
                <CardHeader>
                    <CardTitle>Overall Manager Comment</CardTitle>
                </CardHeader>
                <CardContent>
                    <textarea className="min-h-32 w-full rounded-md border bg-background px-3 py-2" value={data.comment} onChange={(event) => setData('comment', event.target.value)} />
                </CardContent>
            </Card>
            <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => put(route('performance.appraisals.manager_review.update', appraisal.id))} disabled={processing}>
                    Save Review
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                        put(route('performance.appraisals.manager_review.update', appraisal.id), {
                            onSuccess: () => post(route('performance.appraisals.manager_review.submit', appraisal.id)),
                        })
                    }
                    disabled={processing}
                >
                    Submit Forward
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.post(route('performance.appraisals.manager_review.send_back', appraisal.id), { reason: 'Returned to employee for updates.', reopened_stage: 'self_assessment' })}
                    disabled={processing}
                >
                    Send Back
                </Button>
            </div>
        </PerformancePage>
    );
}
