import ApprovalTimeline from '@/components/performance/ApprovalTimeline';
import AppraisalWorkflowJourneyCard from '@/components/performance/AppraisalWorkflowJourneyCard';
import CommentPanel from '@/components/performance/CommentPanel';
import CompetencyRatingTable from '@/components/performance/CompetencyRatingTable';
import ObjectiveTable from '@/components/performance/ObjectiveTable';
import PerformancePage from '@/components/performance/PerformancePage';
import ScoreSummaryCard from '@/components/performance/ScoreSummaryCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { Appraisal, Option } from '@/types/performance';
import { Link, usePage } from '@inertiajs/react';
import {
    BadgeCheck,
    CheckCircle2,
    ClipboardCheck,
    ClipboardList,
    Eye,
    FileCheck2,
    FilePenLine,
    FileSpreadsheet,
    FileText,
    FolderClock,
    LayoutDashboard,
    Medal,
    MessageSquareMore,
    NotebookPen,
    Paperclip,
    PieChart,
    Printer,
    ShieldCheck,
    Sparkles,
    Target,
    Trophy,
    ArrowRight,
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
    const hasGoals = (appraisal.objectives ?? []).some((objective) => isMeaningfulGoal(appraisal, objective));
    const canEditGoals = abilities.plan;
    const canOpenSelfAssessment = hasGoals && abilities.selfAssess;
    const canOpenManagerReview = abilities.managerReview;
    const canOpenCalibration = abilities.calibrate;
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
    const approvalCount = appraisal.approvals?.length ?? 0;
    const historyCount = appraisal.status_histories?.length ?? 0;
    const effectiveOverallScore = appraisal.calibrated_overall_score ?? appraisal.overall_score;
    const overallRating = appraisal.calibrated_overall_rating_level?.label ?? appraisal.overall_rating_level?.label ?? 'Not rated yet';
    const statusLabel = formatStatus(appraisal.status);
    const reopenedStageLabel = appraisal.reopened_stage ? formatStatus(appraisal.reopened_stage) : null;
    const workflowProgress = getWorkflowProgress(appraisal.status, appraisal.reopened_stage);

    return (
        <PerformancePage
            title="Appraisal Overview"
            description="A read-only performance report with progress, scores, comments, and workflow history."
            breadcrumbs={breadcrumbs(appraisal)}
            secondaryActions={
                <>
                    {canEditGoals ? (
                        <Button asChild className="bg-emerald-700 text-white hover:bg-emerald-800">
                            <Link href={route('performance.appraisals.plan', appraisal.id)}>
                                <FilePenLine className="mr-2 h-4 w-4" />
                                {hasGoals ? 'Edit Goals' : 'Set Goals'}
                            </Link>
                        </Button>
                    ) : null}
                    {canOpenSelfAssessment ? (
                        <Button asChild className="bg-sky-700 text-white hover:bg-sky-800">
                            <Link href={route('performance.appraisals.self_assessment', appraisal.id)}>
                                <ClipboardCheck className="mr-2 h-4 w-4" />
                                Self Assess
                            </Link>
                        </Button>
                    ) : null}
                    {canOpenManagerReview ? (
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
                    {canOpenCalibration ? (
                        <Button asChild variant="outline">
                            <Link href={route('performance.appraisals.calibration', appraisal.id)}>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Calibration
                            </Link>
                        </Button>
                    ) : null}
                    {abilities.finalize && appraisal.calibrated_at && !isFinalized ? (
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
                        <>
                            <Button asChild variant="outline">
                                <Link href={route('performance.appraisals.print', appraisal.id)}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print preview
                                </Link>
                            </Button>
                            <Button asChild variant="accent">
                                <a
                                    href={route('performance.appraisals.export.pdf', appraisal.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    Export PDF
                                </a>
                            </Button>
                            <Button asChild variant="secondary">
                                <a
                                    href={route('performance.appraisals.export.excel', appraisal.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    Export Excel
                                </a>
                            </Button>
                        </>
                    ) : null}
                </>
            }
        >
            <div className="space-y-6">
                <Card className="overflow-hidden border-0 shadow-lg">
                    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background">
                        <CardContent className="space-y-6 p-6 lg:p-8">
                            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                                <div className="space-y-4">
                                    <Badge variant="secondary" className="w-fit gap-1.5 px-3 py-1">
                                        <Eye className="h-3.5 w-3.5" />
                                        Read-only appraisal report
                                    </Badge>

                                    <div className="space-y-3">
                                        <div className="font-mono-brand text-muted-foreground flex items-center gap-3 text-[11px] tracking-[0.22em] uppercase">
                                            <span className="bg-brand-sand inline-block h-px w-6" />
                                            <span>§ Performance appraisal</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h1 className="font-display text-balance text-foreground text-3xl leading-[1] font-light tracking-tight lg:text-4xl">
                                                {appraisal.employee_name_snapshot}
                                            </h1>
                                            <Badge className="gap-1.5 px-3 py-1">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                {statusLabel}
                                            </Badge>
                                            <Badge variant="outline" className="px-3 py-1">
                                                ID #{appraisal.id}
                                            </Badge>
                                        </div>

                                        <p className="text-muted-foreground max-w-3xl text-[13px] leading-relaxed">
                                            A read-only summary of progress, scores, comments, and approvals. Use the
                                            workflow actions above to advance the cycle.
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <InfoBadge icon={Trophy} label={`Overall rating: ${overallRating}`} />
                                        <InfoBadge icon={Target} label={`${objectiveCount} objectives tracked`} />
                                        <InfoBadge icon={MessageSquareMore} label={`${commentCount} comments logged`} />
                                        {reopenedStageLabel ? <InfoBadge icon={FolderClock} label={`Reopened at ${reopenedStageLabel}`} /> : null}
                                    </div>

                                    <div className="rounded-2xl border bg-background/85 p-4 shadow-sm backdrop-blur">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                                    § Appraisal Progress
                                                </div>
                                                <div className="font-display text-foreground mt-1 text-base leading-tight font-light tracking-tight">
                                                    {workflowProgress.label}
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="w-fit">
                                                {workflowProgress.percent}% complete
                                            </Badge>
                                        </div>
                                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-primary transition-all"
                                                style={{ width: `${workflowProgress.percent}%` }}
                                            />
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                            <span>{workflowProgress.description}</span>
                                            {canEditGoals ? (
                                                <>
                                                    <span>•</span>
                                                    <Link
                                                        href={route('performance.appraisals.plan', appraisal.id)}
                                                        className="inline-flex items-center gap-1 font-medium text-primary"
                                                    >
                                                        {hasGoals ? 'Edit Goals' : 'Set Goals'}
                                                        <ArrowRight className="h-3.5 w-3.5" />
                                                    </Link>
                                                </>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid min-w-full gap-3 sm:grid-cols-2 xl:min-w-[340px] xl:max-w-[360px]">
                                    <HighlightCard
                                        icon={Medal}
                                        label="Overall Rating"
                                        value={overallRating}
                                        hint="Current performance outcome"
                                    />
                                    <HighlightCard
                                        icon={Workflow}
                                        label="Workflow Status"
                                        value={statusLabel}
                                        hint="Current stage in the cycle"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </div>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <MetricCard icon={Target} label="Objectives" value={String(objectiveCount)} hint="Goals included" />
                    <MetricCard icon={PieChart} label="Weight Total" value={`${totalObjectiveWeight}%`} hint="Combined weighting" />
                    <MetricCard icon={Paperclip} label="Evidence" value={String(evidenceCount)} hint="Uploaded proof items" />
                    <MetricCard icon={MessageSquareMore} label="Comments" value={String(commentCount)} hint="Discussion entries" />
                    <MetricCard icon={ShieldCheck} label="Approvals" value={String(approvalCount)} hint={`${historyCount} workflow updates`} />
                </div>

                <div className="grid gap-6 xl:grid-cols-12">
                    <div className="space-y-6 xl:col-span-8">
                        <Card className="border-0 shadow-md">
                            <CardHeader className="border-b bg-muted/20">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <LayoutDashboard className="h-4.5 w-4.5" />
                                    Executive Summary
                                </CardTitle>
                                <CardDescription>
                                    High-level appraisal results and weighted score performance.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-5">
                                <ScoreSummaryCard
                                    businessScore={appraisal.business_score}
                                    valuesScore={appraisal.values_score}
                                    overallScore={effectiveOverallScore}
                                    overallRating={overallRating}
                                />
                            </CardContent>
                        </Card>

                        {appraisal.latest_calibration ? (
                            <Card className="border-0 shadow-md">
                                <CardHeader className="border-b bg-muted/20">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Sparkles className="h-4.5 w-4.5" />
                                        Calibration Summary
                                    </CardTitle>
                                    <CardDescription>
                                        Committee review of the approved outcome before finalization.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 p-5">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-2xl border bg-background p-4">
                                            <div className="text-xs uppercase tracking-wide text-muted-foreground">Original approved result</div>
                                            <div className="mt-2 text-sm font-medium text-foreground">
                                                {appraisal.overall_score ?? 'N/A'}% · {appraisal.overall_rating_level?.label ?? 'Unrated'}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border bg-background p-4">
                                            <div className="text-xs uppercase tracking-wide text-muted-foreground">Calibrated result</div>
                                            <div className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
                                                {effectiveOverallScore ?? 'N/A'}% · {overallRating}
                                                {appraisal.calibrated_overall_score != null ? (
                                                    <Badge className="gap-1.5">
                                                        <Sparkles className="h-3.5 w-3.5" />
                                                        Adjusted by Calibration Committee
                                                    </Badge>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border bg-muted/20 p-4">
                                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Committee comments</div>
                                        <div className="mt-2 text-sm leading-6 text-foreground">
                                            {appraisal.calibration_comment ?? appraisal.latest_calibration.comments}
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                                            <span>Reviewed by: {appraisal.calibrated_by?.name ?? appraisal.latest_calibration.actor?.name ?? 'N/A'}</span>
                                            {appraisal.latest_calibration.evidence_summary ? (
                                                <span>Evidence: {appraisal.latest_calibration.evidence_summary}</span>
                                            ) : null}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : null}

                        <Card className="border-0 shadow-md">
                            <CardHeader className="border-b bg-muted/20">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Target className="h-4.5 w-4.5" />
                                    Objectives & Results
                                </CardTitle>
                                <CardDescription>
                                    Review objectives, progress evidence, weights, and ratings in a structured report view.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-5">
                                <ObjectiveTable
                                    appraisalId={appraisal.id}
                                    objectives={appraisal.objectives ?? []}
                                    mode="show"
                                    perspectiveOptions={perspectiveOptions}
                                    ratingLevels={objectiveLevels}
                                />
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-md">
                            <CardHeader className="border-b bg-muted/20">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <ShieldCheck className="h-4.5 w-4.5" />
                                    Values
                                </CardTitle>
                                <CardDescription>
                                    A read-only view of behavior, values, and competency ratings captured during the cycle.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-5">
                                <CompetencyRatingTable
                                    ratings={appraisal.competency_ratings ?? []}
                                    mode="show"
                                    ratingLevels={competencyLevels}
                                />
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-md">
                            <CardHeader className="border-b bg-muted/20">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <MessageSquareMore className="h-4.5 w-4.5" />
                                    Review Notes & Discussion
                                </CardTitle>
                                <CardDescription>
                                    Feedback, clarifications, and recorded comments from the appraisal process.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-5">
                                <CommentPanel comments={appraisal.comments ?? []} />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6 xl:col-span-4">
                        <AppraisalWorkflowJourneyCard
                            appraisalId={appraisal.id}
                            status={appraisal.status}
                            reopenedStage={appraisal.reopened_stage}
                        stageAccess={{
                            goal_setting: canEditGoals,
                            self_assessment_pending: canOpenSelfAssessment,
                            manager_review_pending: canOpenManagerReview,
                            approval_pending: abilities.approve,
                            calibration_pending: canOpenCalibration,
                            finalized: abilities.finalize,
                        }}
                    />

                        <Card className="border-0 shadow-md">
                            <CardHeader className="border-b bg-muted/20">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileCheck2 className="h-4.5 w-4.5" />
                                    Appraisal Facts
                                </CardTitle>
                                <CardDescription>
                                    Quick reference details for this appraisal record.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-3 p-5">
                                <FactRow icon={ClipboardList} label="Record ID" value={`#${appraisal.id}`} />
                                <FactRow icon={CheckCircle2} label="Status" value={statusLabel} />
                                <FactRow icon={Medal} label="Overall rating" value={overallRating} />
                                <FactRow
                                    icon={NotebookPen}
                                    label="Development plan"
                                    value={appraisal.development_plan ? 'Created' : 'Not created'}
                                />
                                {reopenedStageLabel ? (
                                    <FactRow icon={FolderClock} label="Reopened stage" value={reopenedStageLabel} />
                                ) : null}
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-md">
                            <CardHeader className="border-b bg-muted/20">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Workflow className="h-4.5 w-4.5" />
                                    Approval & Audit Trail
                                </CardTitle>
                                <CardDescription>
                                    A chronological history of approvals and status changes.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-5">
                                <ApprovalTimeline
                                    approvals={appraisal.approvals ?? []}
                                    histories={appraisal.status_histories ?? []}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </PerformancePage>
    );
}

type MetricCardProps = {
    icon: typeof Target;
    label: string;
    value: string;
    hint: string;
};

function MetricCard({ icon: Icon, label, value, hint }: MetricCardProps) {
    return (
        <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <p className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                            {label}
                        </p>
                        <p className="font-display text-foreground text-2xl leading-none font-light tracking-tight">
                            {value}
                        </p>
                    </div>
                    <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
                <p className="text-muted-foreground mt-3 text-[12px]">{hint}</p>
            </CardContent>
        </Card>
    );
}

type HighlightCardProps = {
    icon: typeof Trophy;
    label: string;
    value: string;
    hint: string;
};

function HighlightCard({ icon: Icon, label, value, hint }: HighlightCardProps) {
    return (
        <div className="rounded-2xl border bg-background/85 p-4 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <p className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">{label}</p>
                    <p className="font-display text-foreground text-lg leading-tight font-light tracking-tight">
                        {value}
                    </p>
                </div>
                <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <p className="text-muted-foreground mt-3 text-[12px]">{hint}</p>
        </div>
    );
}

type InfoBadgeProps = {
    icon: typeof Sparkles;
    label: string;
};

function InfoBadge({ icon: Icon, label }: InfoBadgeProps) {
    return (
        <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-sm text-foreground shadow-sm">
            <Icon className="h-3.5 w-3.5 text-primary" />
            <span>{label}</span>
        </div>
    );
}

type FactRowProps = {
    icon: typeof FileCheck2;
    label: string;
    value: string;
};

function FactRow({ icon: Icon, label, value }: FactRowProps) {
    return (
        <div className="flex items-start gap-3 rounded-2xl border bg-background p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="text-sm font-medium text-foreground">{value}</p>
            </div>
        </div>
    );
}

function formatStatus(value: string) {
    return value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getWorkflowProgress(status: string, reopenedStage?: string | null) {
    const progressMap: Record<string, { percent: number; label: string; description: string }> = {
        draft: {
            percent: 5,
            label: 'Appraisal created',
            description: 'The appraisal record exists, but goals still need to be agreed.',
        },
        goal_setting: {
            percent: 20,
            label: 'Goal setting in progress',
            description: 'Employee and manager can still define or edit the appraisal goals.',
        },
        self_assessment_pending: {
            percent: 40,
            label: 'Awaiting self assessment',
            description: 'Goals are in place and the employee can complete the self assessment.',
        },
        self_assessment_submitted: {
            percent: 55,
            label: 'Self assessment submitted',
            description: 'Employee input is complete and ready for manager review.',
        },
        manager_review_pending: {
            percent: 70,
            label: 'Manager review in progress',
            description: 'The line manager should review ratings, evidence, and comments now.',
        },
        manager_review_completed: {
            percent: 82,
            label: 'Manager review completed',
            description: 'Manager scoring is complete and the appraisal is moving toward approval.',
        },
        approval_pending: {
            percent: 88,
            label: 'Awaiting approval',
            description: 'The approving manager can now approve or send the appraisal back.',
        },
        approved: {
            percent: 92,
            label: 'Approved and queued',
            description: 'Approval is complete and the appraisal is now waiting for calibration review.',
        },
        calibration_pending: {
            percent: 96,
            label: 'Calibration in progress',
            description: 'The calibration committee can now confirm or adjust the final overall result.',
        },
        finalized: {
            percent: 100,
            label: 'Finalized',
            description: 'The appraisal is complete and locked as the final performance record.',
        },
        sent_back: {
            percent: 30,
            label: 'Sent back for correction',
            description: reopenedStage
                ? `The appraisal was returned to ${formatStatus(reopenedStage)} for updates.`
                : 'The appraisal was sent back for updates before it can continue.',
        },
    };

    if (status === 'sent_back') {
        if (reopenedStage === 'goal_setting') {
            return {
                percent: 20,
                label: 'Returned to goal setting',
                description: 'Goals need to be reviewed and updated before the appraisal can continue.',
            };
        }

        if (reopenedStage === 'self_assessment') {
            return {
                percent: 40,
                label: 'Returned to self assessment',
                description: 'The employee should revise the self assessment and resubmit it.',
            };
        }

        if (reopenedStage === 'manager_review') {
            return {
                percent: 70,
                label: 'Returned to manager review',
                description: 'The manager needs to revisit the ratings or comments before approval.',
            };
        }

        if (reopenedStage === 'approval') {
            return {
                percent: 88,
                label: 'Returned to approval',
                description: 'The appraisal was returned at approval stage and needs correction before approval can continue.',
            };
        }

        if (reopenedStage === 'calibration') {
            return {
                percent: 96,
                label: 'Returned to calibration',
                description: 'The appraisal was returned to calibration so the committee can revisit the final outcome.',
            };
        }
    }

    return progressMap[status] ?? progressMap.draft;
}

function isMeaningfulGoal(appraisal: Appraisal, objective: Appraisal['objectives'][number]) {
    const title = objective.title?.trim() ?? '';
    const kpi = objective.kpi_measure?.trim() ?? '';
    const target = objective.target_definition?.trim() ?? '';
    const evidence = objective.evidence_source?.trim() ?? '';
    const performance = objective.performance_achieved?.trim() ?? '';
    const employeeComment = objective.employee_comment?.trim() ?? '';
    const managerComment = objective.manager_comment?.trim() ?? '';
    const dueDate = objective.due_date?.trim() ?? '';
    const hasRatings = Boolean(objective.self_rating_scale_level_id || objective.manager_rating_scale_level_id);
    const hasEvidenceRows = (objective.evidences?.length ?? 0) > 0;
    const hasLinkedLibraryItem = Boolean(objective.goal_library_item_id);

    const templateItem = objective.template_item_id
        ? (appraisal.template?.items ?? []).find((item) => item.id === objective.template_item_id)
        : null;

    const matchesTemplateDefaults = Boolean(
        templateItem &&
            title === (templateItem.title?.trim() ?? '') &&
            target === (templateItem.description?.trim() ?? '') &&
            evidence === (templateItem.evidence_source_hint?.trim() ?? '') &&
            Number(objective.weight ?? 0) === Number(templateItem.default_weight ?? 0) &&
            !kpi &&
            !performance &&
            !employeeComment &&
            !managerComment &&
            !dueDate &&
            !hasRatings &&
            !hasEvidenceRows &&
            !hasLinkedLibraryItem,
    );

    const isGenericPlaceholderTitle = /^Objective\s+\d+$/i.test(title);

    if (matchesTemplateDefaults || isGenericPlaceholderTitle) {
        return false;
    }

    return Boolean(
        hasLinkedLibraryItem ||
            title ||
            kpi ||
            target ||
            evidence ||
            performance ||
            employeeComment ||
            managerComment ||
            dueDate ||
            Number(objective.weight ?? 0) > 0 ||
            hasRatings ||
            hasEvidenceRows,
    );
}
