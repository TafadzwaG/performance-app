import AppraisalHeader from '@/components/performance/AppraisalHeader';
import ApprovalTimeline from '@/components/performance/ApprovalTimeline';
import CommentPanel from '@/components/performance/CommentPanel';
import CompetencyRatingTable from '@/components/performance/CompetencyRatingTable';
import ObjectiveTable from '@/components/performance/ObjectiveTable';
import PerformancePage from '@/components/performance/PerformancePage';
import ScoreSummaryCard from '@/components/performance/ScoreSummaryCard';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal, Option } from '@/types/performance';

const breadcrumbs = (appraisal: Appraisal): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Appraisals', href: route('performance.appraisals.index') },
    { title: appraisal.employee_name_snapshot, href: route('performance.appraisals.show', appraisal.id) },
    { title: 'Print', href: route('performance.appraisals.print', appraisal.id) },
];

export default function AppraisalPrint({ appraisal }: { appraisal: Appraisal }) {
    const perspectiveOptions: Option[] = (appraisal.objectives ?? []).map((objective) => ({
        value: objective.perspective_id,
        label: objective.perspective?.name ?? `Perspective ${objective.perspective_id}`,
    }));

    return (
        <PerformancePage
            title="Print Appraisal"
            description="Print-friendly appraisal summary and export actions."
            breadcrumbs={breadcrumbs(appraisal)}
            secondaryActions={
                <>
                    <Button type="button" variant="outline" onClick={() => window.print()}>
                        Print
                    </Button>
                    <Button asChild variant="outline">
                        <a href={route('performance.appraisals.print.pdf', appraisal.id)}>Download PDF</a>
                    </Button>
                </>
            }
        >
            <AppraisalHeader appraisal={appraisal} />
            <ScoreSummaryCard
                businessScore={appraisal.business_score}
                valuesScore={appraisal.values_score}
                overallScore={appraisal.overall_score}
                overallRating={appraisal.overall_rating_level?.label ?? null}
            />
            <ObjectiveTable appraisalId={appraisal.id} objectives={appraisal.objectives ?? []} mode="show" perspectiveOptions={perspectiveOptions} />
            <CompetencyRatingTable ratings={appraisal.competency_ratings ?? []} mode="show" ratingLevels={appraisal.template?.competency_rating_scale?.levels ?? []} />
            <CommentPanel comments={appraisal.comments ?? []} />
            <ApprovalTimeline approvals={appraisal.approvals ?? []} histories={appraisal.status_histories ?? []} />
        </PerformancePage>
    );
}
