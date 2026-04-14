import AppraisalHeader from '@/components/performance/AppraisalHeader';
import AppraisalWorkflowStepper from '@/components/performance/AppraisalWorkflowStepper';
import ApprovalTimeline from '@/components/performance/ApprovalTimeline';
import CommentPanel from '@/components/performance/CommentPanel';
import CompetencyRatingTable from '@/components/performance/CompetencyRatingTable';
import ObjectiveTable from '@/components/performance/ObjectiveTable';
import PerformancePage from '@/components/performance/PerformancePage';
import ScoreSummaryCard from '@/components/performance/ScoreSummaryCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { Appraisal, Option } from '@/types/performance';
import { Link, usePage } from '@inertiajs/react';
import {
    BadgeCheck,
    ClipboardCheck,
    ClipboardList,
    FileCheck2,
    FilePenLine,
    PieChart,
    Paperclip,
    MessageSquareMore,
    NotebookPen,
    Printer,
    ShieldCheck,
    Target,
    Trophy,
    UserCheck,
    Workflow,
} from 'lucide-react';

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
    const { auth } = usePage<SharedData>().props;
    const isFinalized = appraisal.status === 'finalized';
    const canOpenDevelopmentPlan =
        auth.permissions.includes('performance.development_plans.view') ||
        auth.permissions.includes('performance.development_plans.update');

    const perspectiveOptions: Option[] = (appraisal.template?.items ?? [])
        .filter((item) => item.perspective)
        .map((item) => ({
            value: item.perspective?.id ?? 0,
            label: item.perspective?.name ?? '',
        }));

    const objectiveLevels = appraisal.template?.objective_rating_scale?.levels ?? [];
    const competencyLevels = appraisal.template?.competency_rating_scale?.levels ?? [];
    const objectiveCount = appraisal.objectives?.length ?? 0;
    const totalObjectiveWeight = (appraisal.objectives ?? []).reduce((sum, objective) => sum + Number(objective.weight ?? 0), 0);
    const commentCount = appraisal.comments?.length ?? 0;
    const evidenceCount = (appraisal.objectives ?? []).reduce((sum, objective) => sum + (objective.evidences?.length ?? 0), 0);

    return (
        <PerformancePage
            title="Appraisal Overview"
            description="Review objective progress, ratings, comments, and workflow history."
            breadcrumbs={breadcrumbs(appraisal)}
            secondaryActions={
                <>
                    {abilities.plan ? (
                        <Button asChild className="bg-emerald-700 text-white hover:bg-emerald-800">
                            <Link href={route('performance.appraisals.plan', appraisal.id)}>
                                <FilePenLine className="mr-2 h-4 w-4" />
                                Plan Goals
                            </Link>
                        </Button>
                    ) : null}
                    {abilities.selfAssess ? (
                        <Button asChild className="bg-sky-700 text-white hover:bg-sky-800">
                            <Link href={route('performance.appraisals.self_assessment', appraisal.id)}>
                                <ClipboardCheck className="mr-2 h-4 w-4" />
                                Self Assess
                            </Link>
                        </Button>
                    ) : null}
                    {abilities.managerReview ? (
                        <Button asChild variant="outline">
                            <Link href={route('performance.appraisals.manager_review', appraisal.id)}>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Manager Review
                            </Link>
                        </Button>
                    ) : null}
                    {abilities.approve ? (
                        <Button asChild variant="outline">
                            <Link href={route('performance.appraisals.approval', appraisal.id)}>
                                <BadgeCheck className="mr-2 h-4 w-4" />
                                Approve
                            </Link>
                        </Button>
                    ) : null}
                    {abilities.finalize && !isFinalized ? (
                        <Button asChild variant="outline">
                            <Link href={route('performance.appraisals.finalize', appraisal.id)}>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Finalize
                            </Link>
                        </Button>
                    ) : null}
                    {isFinalized && canOpenDevelopmentPlan ? (
                        <Button asChild variant="outline">
                            <Link href={route('performance.development_plans.edit', appraisal.id)}>
                                <NotebookPen className="mr-2 h-4 w-4" />
                                {appraisal.development_plan ? 'Update Development Plan' : 'Create Development Plan'}
                            </Link>
                        </Button>
                    ) : null}
                    {abilities.print ? (
                        <Button asChild className="bg-amber-600 text-white hover:bg-amber-700">
                            <Link href={route('performance.appraisals.print', appraisal.id)}>
                                <Printer className="mr-2 h-4 w-4" />
                                Print
                            </Link>
                        </Button>
                    ) : null}
                </>
            }
        >
            <Card className="border shadow-sm">
                <CardContent className="space-y-4 p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ClipboardList className="h-4 w-4" />
                            Appraisal Summary
                        </div>
                        <Badge variant="secondary">ID #{appraisal.id}</Badge>
                    </div>
                    <AppraisalHeader appraisal={appraisal} />
                </CardContent>
            </Card>

            <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Workflow className="h-4.5 w-4.5" />
                        Workflow Progress
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
                        <FileCheck2 className="h-4.5 w-4.5" />
                        Appraisal Snapshot
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border bg-muted/20 p-3">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                            <Target className="h-3.5 w-3.5" />
                            Objectives
                        </div>
                        <div className="mt-1 text-xl font-semibold text-foreground">{objectiveCount}</div>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                            <PieChart className="h-3.5 w-3.5" />
                            Weight Total
                        </div>
                        <div className="mt-1 text-xl font-semibold text-foreground">{totalObjectiveWeight}%</div>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                            <MessageSquareMore className="h-3.5 w-3.5" />
                            Comments
                        </div>
                        <div className="mt-1 text-xl font-semibold text-foreground">{commentCount}</div>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                            <Paperclip className="h-3.5 w-3.5" />
                            Evidence Items
                        </div>
                        <div className="mt-1 text-xl font-semibold text-foreground">{evidenceCount}</div>
                    </div>
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-4.5 w-4.5" />
                        Objectives
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ObjectiveTable appraisalId={appraisal.id} objectives={appraisal.objectives ?? []} mode="show" perspectiveOptions={perspectiveOptions} ratingLevels={objectiveLevels} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-4.5 w-4.5" />
                        Competencies / Values
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <CompetencyRatingTable ratings={appraisal.competency_ratings ?? []} mode="show" ratingLevels={competencyLevels} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquareMore className="h-4.5 w-4.5" />
                        Comments
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <CommentPanel comments={appraisal.comments ?? []} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Workflow className="h-4.5 w-4.5" />
                        Approval & Audit Trail
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ApprovalTimeline approvals={appraisal.approvals ?? []} histories={appraisal.status_histories ?? []} />
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
