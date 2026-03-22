import AppraisalHeader from '@/components/performance/AppraisalHeader';
import AppraisalWorkflowStepper from '@/components/performance/AppraisalWorkflowStepper';
import ApprovalTimeline from '@/components/performance/ApprovalTimeline';
import CommentPanel from '@/components/performance/CommentPanel';
import CompetencyRatingTable from '@/components/performance/CompetencyRatingTable';
import ObjectiveTable from '@/components/performance/ObjectiveTable';
import PerformancePage from '@/components/performance/PerformancePage';
import ScoreSummaryCard from '@/components/performance/ScoreSummaryCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal, Option } from '@/types/performance';
import { Link } from '@inertiajs/react';

interface Props {
    appraisal: Appraisal;
    abilities: Record<string, boolean>;
}

const breadcrumbs = (appraisal: Appraisal): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Appraisals', href: route('performance.appraisals.index') },
    { title: appraisal.employee_name_snapshot, href: route('performance.appraisals.show', appraisal.id) },
];

export default function AppraisalShow({ appraisal, abilities }: Props) {
    const perspectiveOptions: Option[] = (appraisal.template?.items ?? [])
        .filter((item) => item.perspective)
        .map((item) => ({
            value: item.perspective?.id ?? 0,
            label: item.perspective?.name ?? '',
        }));

    const objectiveLevels = appraisal.template?.objective_rating_scale?.levels ?? [];
    const competencyLevels = appraisal.template?.competency_rating_scale?.levels ?? [];

    return (
        <PerformancePage
            title="Appraisal Overview"
            description="Review objective progress, ratings, comments, and workflow history."
            breadcrumbs={breadcrumbs(appraisal)}
            secondaryActions={
                <>
                    {abilities.plan ? (
                        <Button asChild variant="outline">
                            <Link href={route('performance.appraisals.plan', appraisal.id)}>Plan Goals</Link>
                        </Button>
                    ) : null}
                    {abilities.selfAssess ? (
                        <Button asChild variant="outline">
                            <Link href={route('performance.appraisals.self_assessment', appraisal.id)}>Self Assess</Link>
                        </Button>
                    ) : null}
                    {abilities.managerReview ? (
                        <Button asChild variant="outline">
                            <Link href={route('performance.appraisals.manager_review', appraisal.id)}>Manager Review</Link>
                        </Button>
                    ) : null}
                    {abilities.approve ? (
                        <Button asChild variant="outline">
                            <Link href={route('performance.appraisals.approval', appraisal.id)}>Approve</Link>
                        </Button>
                    ) : null}
                    {abilities.finalize ? (
                        <Button asChild variant="outline">
                            <Link href={route('performance.appraisals.finalize', appraisal.id)}>Finalize</Link>
                        </Button>
                    ) : null}
                    {abilities.print ? (
                        <Button asChild variant="outline">
                            <Link href={route('performance.appraisals.print', appraisal.id)}>Print</Link>
                        </Button>
                    ) : null}
                </>
            }
        >
            <AppraisalHeader appraisal={appraisal} />
            <AppraisalWorkflowStepper status={appraisal.status} />
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
                    <ObjectiveTable appraisalId={appraisal.id} objectives={appraisal.objectives ?? []} mode="show" perspectiveOptions={perspectiveOptions} ratingLevels={objectiveLevels} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Competencies / Values</CardTitle>
                </CardHeader>
                <CardContent>
                    <CompetencyRatingTable ratings={appraisal.competency_ratings ?? []} mode="show" ratingLevels={competencyLevels} />
                </CardContent>
            </Card>
            <CommentPanel comments={appraisal.comments ?? []} />
            <ApprovalTimeline approvals={appraisal.approvals ?? []} histories={appraisal.status_histories ?? []} />
        </PerformancePage>
    );
}
