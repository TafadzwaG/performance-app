import AppraisalHeader from '@/components/performance/AppraisalHeader';
import AppraisalWorkflowStepper from '@/components/performance/AppraisalWorkflowStepper';
import ApprovalTimeline from '@/components/performance/ApprovalTimeline';
import CommentPanel from '@/components/performance/CommentPanel';
import CompetencyRatingTable from '@/components/performance/CompetencyRatingTable';
import ObjectiveTable from '@/components/performance/ObjectiveTable';
import PerformancePage from '@/components/performance/PerformancePage';
import ScoreSummaryCard from '@/components/performance/ScoreSummaryCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal, Option } from '@/types/performance';
import { Download, Printer, Trophy, Workflow } from 'lucide-react';

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
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                    <Button asChild variant="outline">
                        <a href={route('performance.appraisals.print.pdf', appraisal.id)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                        </a>
                    </Button>
                </>
            }
        >
            <Card className="border shadow-sm">
                <CardContent className="space-y-4 p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-sm text-muted-foreground">Printable Appraisal Pack</div>
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
                    <AppraisalWorkflowStepper status={appraisal.status} />
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

            <ObjectiveTable
                appraisalId={appraisal.id}
                objectives={appraisal.objectives ?? []}
                mode="show"
                perspectiveOptions={perspectiveOptions}
                ratingLevels={appraisal.template?.objective_rating_scale?.levels ?? []}
            />
            <CompetencyRatingTable
                ratings={appraisal.competency_ratings ?? []}
                mode="show"
                ratingLevels={appraisal.template?.competency_rating_scale?.levels ?? []}
            />
            <CommentPanel comments={appraisal.comments ?? []} />
            <ApprovalTimeline approvals={appraisal.approvals ?? []} histories={appraisal.status_histories ?? []} />
        </PerformancePage>
    );
}
