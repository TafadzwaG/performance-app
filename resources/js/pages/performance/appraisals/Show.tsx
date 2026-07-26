import AppraisalSteps, {
    AppraisalHeaderAction,
    getAppraisalContinueAction,
    getAppraisalWaitingAction,
    useEnabledAppraisalStages,
} from '@/components/performance/AppraisalSteps';
import ApprovalTimeline from '@/components/performance/ApprovalTimeline';
import CommentPanel from '@/components/performance/CommentPanel';
import PerformancePage from '@/components/performance/PerformancePage';
import ScoreSummaryCard from '@/components/performance/ScoreSummaryCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/date-utils';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { Appraisal, RatingScaleLevel } from '@/types/performance';
import { Link, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowRight,
    BadgeCheck,
    CheckCircle2,
    ClipboardCheck,
    ClipboardList,
    FileCheck2,
    FileSpreadsheet,
    FileText,
    FolderClock,
    LayoutDashboard,
    ListChecks,
    Medal,
    MessageSquareMore,
    NotebookPen,
    Printer,
    ShieldCheck,
    Sparkles,
    Target,
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
    const enabledStages = useEnabledAppraisalStages();
    const isFinalized = appraisal.status === 'finalized';
    const hasGoals = (appraisal.objectives ?? []).some((objective) => isMeaningfulGoal(appraisal, objective));
    const canOpenDevelopmentPlan =
        auth.permissions.includes('performance.development_plans.view') || auth.permissions.includes('performance.development_plans.update');
    const continueAction = getAppraisalContinueAction(appraisal, abilities, hasGoals, canOpenDevelopmentPlan, enabledStages);
    const waitingAction = getAppraisalWaitingAction(appraisal, abilities, hasGoals, canOpenDevelopmentPlan, enabledStages);

    const effectiveOverallScore = appraisal.calibrated_overall_score ?? appraisal.overall_score;
    const overallRating = appraisal.calibrated_overall_rating_level?.label ?? appraisal.overall_rating_level?.label ?? 'Not rated yet';
    const statusLabel = formatStatus(appraisal.status);
    const reopenedStageLabel = appraisal.reopened_stage ? formatStatus(appraisal.reopened_stage) : null;

    return (
        <PerformancePage
            title="Appraisal Overview"
            description="A read-only performance report with progress, scores, comments, and workflow history."
            breadcrumbs={breadcrumbs(appraisal)}
            secondaryActions={
                <>
                    <AppraisalHeaderAction
                        continueAction={continueAction}
                        waitingAction={waitingAction}
                        size="lg"
                    />
                    {abilities.print ? (
                        <>
                            <Button asChild variant="outline">
                                <Link href={route('performance.appraisals.print', appraisal.id)}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print preview
                                </Link>
                            </Button>
                            <Button asChild variant="accent">
                                <a href={route('performance.appraisals.export.pdf', appraisal.id)} target="_blank" rel="noopener noreferrer">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Export PDF
                                </a>
                            </Button>
                            <Button asChild variant="secondary">
                                <a href={route('performance.appraisals.export.excel', appraisal.id)} target="_blank" rel="noopener noreferrer">
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
                <AppraisalSteps
                    appraisal={appraisal}
                    abilities={abilities}
                    hasGoals={hasGoals}
                    canOpenDevelopmentPlan={canOpenDevelopmentPlan}
                    showStartButton={false}
                />

                <AssessmentFormView appraisal={appraisal} />

                <div className="grid gap-6 xl:grid-cols-12">
                    <div className="space-y-6 xl:col-span-8">
                        <Card className="border-0 shadow-md">
                            <CardHeader className="bg-muted/20 border-b">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <LayoutDashboard className="h-4.5 w-4.5" />
                                    Executive Summary
                                </CardTitle>
                                <CardDescription>High-level appraisal results and weighted score performance.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5">
                                <ScoreSummaryCard
                                    businessScore={appraisal.business_score}
                                    overallScore={effectiveOverallScore}
                                    overallRating={overallRating}
                                    layout="grid"
                                />
                            </CardContent>
                        </Card>

                        {appraisal.latest_calibration ? (
                            <Card className="border-0 shadow-md">
                                <CardHeader className="bg-muted/20 border-b">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Sparkles className="h-4.5 w-4.5" />
                                        Calibration Summary
                                    </CardTitle>
                                    <CardDescription>Committee review of the approved outcome before finalization.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 p-5">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="bg-background rounded-2xl border p-4">
                                            <div className="text-muted-foreground text-xs tracking-wide uppercase">Original approved result</div>
                                            <div className="text-foreground mt-2 text-sm font-medium">
                                                {appraisal.overall_score ?? 'N/A'}% · {appraisal.overall_rating_level?.label ?? 'Unrated'}
                                            </div>
                                        </div>
                                        <div className="bg-background rounded-2xl border p-4">
                                            <div className="text-muted-foreground text-xs tracking-wide uppercase">Calibrated result</div>
                                            <div className="text-foreground mt-2 flex items-center gap-2 text-sm font-medium">
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

                                    <div className="bg-muted/20 rounded-2xl border p-4">
                                        <div className="text-muted-foreground text-xs tracking-wide uppercase">Committee comments</div>
                                        <div className="text-foreground mt-2 text-sm leading-6">
                                            {appraisal.calibration_comment ?? appraisal.latest_calibration.comments}
                                        </div>
                                        <div className="text-muted-foreground mt-3 flex flex-wrap gap-4 text-xs">
                                            <span>
                                                Reviewed by: {appraisal.calibrated_by?.name ?? appraisal.latest_calibration.actor?.name ?? 'N/A'}
                                            </span>
                                            {appraisal.latest_calibration.evidence_summary ? (
                                                <span>Evidence: {appraisal.latest_calibration.evidence_summary}</span>
                                            ) : null}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : null}

                        <Card className="border-0 shadow-md">
                            <CardHeader className="bg-muted/20 border-b">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <MessageSquareMore className="h-4.5 w-4.5" />
                                    Review Notes & Discussion
                                </CardTitle>
                                <CardDescription>Feedback, clarifications, and recorded comments from the appraisal process.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5">
                                <CommentPanel comments={appraisal.comments ?? []} />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6 xl:col-span-4">
                        <Card className="border-0 shadow-md">
                            <CardHeader className="bg-muted/20 border-b">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileCheck2 className="h-4.5 w-4.5" />
                                    Appraisal Facts
                                </CardTitle>
                                <CardDescription>Quick reference details for this appraisal record.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-3 p-5">
                                <FactRow icon={ClipboardList} label="Record ID" value={`#${appraisal.id}`} />
                                <FactRow icon={CheckCircle2} label="Status" value={statusLabel} />
                                <FactRow icon={Medal} label="Overall rating" value={overallRating} />
                                <FactRow icon={NotebookPen} label="Development plan" value={appraisal.development_plan ? 'Created' : 'Not created'} />
                                {reopenedStageLabel ? <FactRow icon={FolderClock} label="Reopened stage" value={reopenedStageLabel} /> : null}
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-md">
                            <CardHeader className="bg-muted/20 border-b">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Workflow className="h-4.5 w-4.5" />
                                    Approval & Audit Trail
                                </CardTitle>
                                <CardDescription>A chronological history of approvals and status changes.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5">
                                <ApprovalTimeline
                                    embedded
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

type StartAction = {
    href: string;
    label: string;
    description: string;
};

function SimpleAppraisalSteps({
    appraisal,
    abilities,
    hasGoals,
    canOpenDevelopmentPlan,
    startAction,
}: {
    appraisal: Appraisal;
    abilities: Record<string, boolean>;
    hasGoals: boolean;
    canOpenDevelopmentPlan: boolean;
    startAction: StartAction | null;
}) {
    const wizardUrl = route('performance.appraisals.plan', appraisal.id);
    const steps = [
        {
            key: 'goal_setting',
            title: '1. Agree your goals',
            description: 'Write the work goals, how they will be measured, the target, evidence, and weight.',
            href: route('performance.appraisals.plan', appraisal.id),
            canOpen: abilities.plan,
            isComplete: hasGoals && !['draft', 'goal_setting'].includes(appraisal.status),
            icon: Target,
        },
        {
            key: 'self_assessment',
            title: '2. Do your self assessment',
            description: 'Add what you achieved, upload evidence where needed, and rate your own performance.',
            href: route('performance.appraisals.self_assessment', appraisal.id),
            canOpen: abilities.selfAssess,
            isComplete: Boolean(appraisal.self_assessment_submitted_at),
            icon: ClipboardCheck,
        },
        {
            key: 'manager_review',
            title: '3. Manager review',
            description: 'Your manager reviews the evidence, adds comments, and gives manager ratings.',
            href: route('performance.appraisals.manager_review', appraisal.id),
            canOpen: abilities.managerReview,
            isComplete: Boolean(appraisal.manager_reviewed_at),
            icon: UserCheck,
        },
        {
            key: 'approval',
            title: '4. Approval',
            description: 'The approving manager checks the appraisal and either approves it or sends it back.',
            href: route('performance.appraisals.approval', appraisal.id),
            canOpen: abilities.approve,
            isComplete: Boolean(appraisal.approved_at),
            icon: BadgeCheck,
        },
        {
            key: 'calibration',
            title: '5. Calibration',
            description: 'The calibration team confirms the final result before the appraisal is closed.',
            href: route('performance.appraisals.calibration', appraisal.id),
            canOpen: abilities.calibrate,
            isComplete: Boolean(appraisal.calibrated_at),
            icon: Sparkles,
        },
        {
            key: 'finalized',
            title: '6. Final record',
            description: 'The final appraisal is locked. A development plan can be created after this point.',
            href: appraisal.development_plan
                ? route('performance.development_plans.edit', appraisal.id)
                : route('performance.development_plans.edit', appraisal.id),
            canOpen: appraisal.status === 'finalized' && canOpenDevelopmentPlan,
            isComplete: appraisal.status === 'finalized',
            icon: FileCheck2,
        },
    ];

    return (
        <section className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="text-foreground flex items-center gap-2 text-base font-semibold">
                        <ListChecks className="text-primary h-4.5 w-4.5" />
                        Appraisal Steps
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">Follow the steps from left to right.</p>
                </div>
                {startAction ? (
                    <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 w-fit">
                        <Link href={wizardUrl}>
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Start My Appraisals
                        </Link>
                    </Button>
                ) : null}
            </div>

            <div className="overflow-x-auto pb-2">
                <div className="grid min-w-[920px] grid-cols-6 items-start gap-3">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isCurrent = startAction?.href === step.href;

                        return (
                            <div key={step.key} className="relative">
                                {index < steps.length - 1 ? (
                                    <div className="bg-border absolute top-5 left-[calc(50%+24px)] h-px w-[calc(100%-24px)]" />
                                ) : null}
                                <Link
                                    href={step.canOpen ? step.href : route('performance.appraisals.show', appraisal.id)}
                                    preserveScroll
                                    className="relative flex flex-col items-center text-center"
                                >
                                    <span
                                        className={`bg-background flex h-10 w-10 items-center justify-center rounded-full border ${
                                            isCurrent
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : step.isComplete
                                                  ? 'border-primary/25 text-primary'
                                                  : 'text-muted-foreground'
                                        }`}
                                    >
                                        {step.isComplete ? <CheckCircle2 className="h-4.5 w-4.5" /> : <Icon className="h-4.5 w-4.5" />}
                                    </span>
                                    <span className="text-foreground mt-2 text-xs font-semibold">{step.title}</span>
                                    <span className="text-muted-foreground mt-1 text-[11px] leading-4">{step.description}</span>
                                    <span className="mt-2 flex min-h-5 items-center justify-center">
                                        {isCurrent ? (
                                            <Badge>Start here</Badge>
                                        ) : step.isComplete ? (
                                            <Badge variant="secondary">Done</Badge>
                                        ) : !step.canOpen ? (
                                            <Badge variant="outline">Wait</Badge>
                                        ) : null}
                                    </span>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function AssessmentFormView({ appraisal }: { appraisal: Appraisal }) {
    const reviewPeriod = getReviewPeriod(appraisal);
    const achievementComments = (appraisal.comments ?? []).filter((comment) => comment.comment_type === 'achievement_note');
    const issueComments = (appraisal.comments ?? []).filter((comment) => comment.comment_type === 'significant_issue');
    const generalComments = (appraisal.comments ?? []).filter((comment) => comment.comment_type === 'general');
    const formDetails: { icon: LucideIcon; label: string; value: string }[] = [
        { icon: UserCheck, label: 'Employee Name', value: appraisal.employee_name_snapshot || '-' },
        { icon: BadgeCheck, label: 'Employee #', value: appraisal.employee_number_snapshot || '-' },
        { icon: ClipboardList, label: 'Job Title', value: appraisal.job_title_name_snapshot || '-' },
        { icon: LayoutDashboard, label: 'Department', value: appraisal.department_name_snapshot || '-' },
        { icon: FolderClock, label: 'Review Period', value: reviewPeriod },
        { icon: UserCheck, label: 'Line Manager', value: appraisal.line_manager?.name || '-' },
        { icon: ShieldCheck, label: 'Approving Manager', value: appraisal.approving_manager?.name || '-' },
        { icon: FileCheck2, label: 'Template', value: appraisal.template_name_snapshot || '-' },
    ];

    return (
        <div className="space-y-6">
            <Card className="border-0 shadow-md">
                <CardHeader className="bg-muted/20 border-b">
                    <CardDescription className="text-[11px] font-medium tracking-[0.18em] uppercase">
                        Individual Performance Assessment Form
                    </CardDescription>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4.5 w-4.5" />
                        Goals
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
                    {formDetails.map(({ icon: Icon, label, value }) => (
                        <div key={label} className="bg-muted/10 flex items-start gap-3 rounded-lg border p-4">
                            <span className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                                <Icon className="h-4.5 w-4.5" />
                            </span>
                            <div className="min-w-0">
                                <div className="text-muted-foreground text-[11px] font-semibold tracking-[0.16em] uppercase">{label}</div>
                                <div className="text-foreground mt-2 text-sm font-medium break-words">{value}</div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
                <CardHeader className="bg-muted/20 border-b">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Target className="h-4.5 w-4.5" />
                        Business Objectives
                    </CardTitle>
                    <CardDescription>Goals, measures, targets, evidence, achieved performance, and ratings.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="min-w-[1120px] text-left text-sm">
                            <thead className="bg-muted/30">
                                <tr>
                                    {[
                                        'Perspective',
                                        'Objective (The Goal)',
                                        'KPI / Measure (How Measured)',
                                        'Target (Success Definition)',
                                        'Weight',
                                        'Evidence Source',
                                        'Performance Achieved',
                                        'Self Rating',
                                        "Manager's Rating",
                                    ].map((heading) => (
                                        <th
                                            key={heading}
                                            className="text-muted-foreground px-4 py-3 text-[11px] font-semibold tracking-[0.14em] uppercase"
                                        >
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(appraisal.objectives ?? []).length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-muted-foreground px-4 py-10 text-center text-sm">
                                            No objectives have been captured for this appraisal yet.
                                        </td>
                                    </tr>
                                ) : (
                                    (appraisal.objectives ?? []).map((objective) => (
                                        <tr key={objective.id} className="border-t align-top">
                                            <td className="px-4 py-4">
                                                <Badge variant="secondary">{objective.perspective?.name || '-'}</Badge>
                                            </td>
                                            <td className="text-foreground px-4 py-4 font-medium">{objective.title || '-'}</td>
                                            <td className="text-muted-foreground px-4 py-4">{objective.kpi_measure || '-'}</td>
                                            <td className="text-muted-foreground px-4 py-4">{objective.target_definition || '-'}</td>
                                            <td className="text-muted-foreground px-4 py-4">
                                                {objective.weight !== null && objective.weight !== undefined ? `${objective.weight}%` : '-'}
                                            </td>
                                            <td className="text-muted-foreground px-4 py-4">{objective.evidence_source || '-'}</td>
                                            <td className="text-muted-foreground px-4 py-4">{objective.performance_achieved || '-'}</td>
                                            <td className="text-muted-foreground px-4 py-4">
                                                {objective.self_rating_level?.label ?? objective.self_rating_score ?? '-'}
                                            </td>
                                            <td className="text-muted-foreground px-4 py-4">
                                                {objective.manager_rating_level?.label ?? objective.manager_rating_score ?? '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <section className="grid gap-6 xl:grid-cols-2">
                <CommentBox title="Other Substantial Achievements" empty="No achievement comments captured." comments={achievementComments} />
                <CommentBox title="Significant Issues" empty="No significant issues captured." comments={issueComments} />
            </section>

            <Card className="border-0 shadow-md">
                <CardHeader className="bg-muted/20 border-b">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <MessageSquareMore className="h-4.5 w-4.5" />
                        Comments
                    </CardTitle>
                    <CardDescription>Individual, manager, and approving manager comments for the form.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 p-5 lg:grid-cols-3">
                    <FormCommentColumn title="Individual Comments" comments={generalComments.map((comment) => comment.body)} />
                    <FormCommentColumn
                        title="Manager Comments"
                        comments={(appraisal.objectives ?? [])
                            .map((objective) => objective.manager_comment)
                            .filter((comment): comment is string => Boolean(comment))}
                    />
                    <FormCommentColumn title="Approving Manager Comments" comments={[]} />
                </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
                <CardHeader className="bg-muted/20 border-b">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Medal className="h-4.5 w-4.5" />
                        Rating Scale Reference
                    </CardTitle>
                    <CardDescription>Business objectives rating scale configured on this appraisal template.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-5">
                    <RatingScaleBox title="Business Objectives Rating Scale" levels={appraisal.template?.objective_rating_scale?.levels ?? []} />
                </CardContent>
            </Card>
        </div>
    );
}

function CommentBox({ title, empty, comments }: { title: string; empty: string; comments: NonNullable<Appraisal['comments']> }) {
    return (
        <Card className="border-0 shadow-md">
            <CardHeader className="bg-muted/20 border-b">
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
                {comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment.id} className="bg-muted/10 rounded-lg border p-4">
                            <p className="text-foreground text-sm leading-6">{comment.body}</p>
                            {comment.author?.name ? <p className="text-muted-foreground mt-2 text-xs">{comment.author.name}</p> : null}
                        </div>
                    ))
                ) : (
                    <div className="bg-muted/10 text-muted-foreground rounded-lg border border-dashed px-6 py-10 text-center text-sm">{empty}</div>
                )}
            </CardContent>
        </Card>
    );
}

function FormCommentColumn({ title, comments }: { title: string; comments: string[] }) {
    return (
        <div className="bg-muted/10 min-h-[150px] rounded-lg border p-4">
            <div className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-[0.16em] uppercase">{title}</div>
            {comments.length > 0 ? (
                <div className="space-y-3">
                    {comments.map((comment, index) => (
                        <p key={`${title}-${index}`} className="text-foreground text-sm leading-6">
                            {comment}
                        </p>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground text-sm">No comments captured.</p>
            )}
        </div>
    );
}

function RatingScaleBox({
    title,
    levels,
}: {
    title: string;
    levels: NonNullable<NonNullable<Appraisal['template']>['objective_rating_scale']>['levels'];
}) {
    const orderedLevels = [...(levels ?? [])].sort((left, right) => {
        const leftOrder = left.sort_order ?? left.value ?? 0;
        const rightOrder = right.sort_order ?? right.value ?? 0;

        return leftOrder - rightOrder;
    });

    return (
        <div className="bg-muted/10 overflow-hidden rounded-lg border">
            <div className="bg-background flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                <div>
                    <div className="text-foreground text-sm font-semibold">{title}</div>
                    <div className="text-muted-foreground mt-1 text-xs">Ordered from lowest to highest rating.</div>
                </div>
                <Badge variant="outline">{orderedLevels.length} levels</Badge>
            </div>

            {orderedLevels.length > 0 ? (
                <div className="divide-y">
                    <div className="text-muted-foreground bg-muted/30 hidden grid-cols-[72px_minmax(160px,1fr)_minmax(140px,180px)_minmax(220px,2fr)] gap-4 px-4 py-2 text-[11px] font-semibold tracking-[0.14em] uppercase md:grid">
                        <span>Level</span>
                        <span>Rating</span>
                        <span>Score / Range</span>
                        <span>Description</span>
                    </div>

                    {orderedLevels.map((level, index) => (
                        <div
                            key={level.id}
                            className="bg-background grid gap-3 px-4 py-4 text-sm md:grid-cols-[72px_minmax(160px,1fr)_minmax(140px,180px)_minmax(220px,2fr)] md:items-start md:gap-4"
                        >
                            <div className="flex items-center gap-2">
                                <span className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold">
                                    {level.short_label || level.value || index + 1}
                                </span>
                            </div>

                            <div>
                                <div className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-[0.14em] uppercase md:hidden">
                                    Rating
                                </div>
                                <div className="text-foreground font-medium">{level.label}</div>
                                {level.is_default ? (
                                    <Badge variant="secondary" className="mt-2">
                                        Default
                                    </Badge>
                                ) : null}
                            </div>

                            <div>
                                <div className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-[0.14em] uppercase md:hidden">
                                    Score / Range
                                </div>
                                <span className="text-muted-foreground">{formatRatingScaleRange(level)}</span>
                            </div>

                            <div>
                                <div className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-[0.14em] uppercase md:hidden">
                                    Description
                                </div>
                                <p className="text-muted-foreground leading-6">{level.description || 'No description captured.'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground bg-background px-4 py-6 text-sm">No scale levels configured.</p>
            )}
        </div>
    );
}

function formatRatingScaleRange(level: RatingScaleLevel) {
    if (level.min_percent !== null && level.min_percent !== undefined && level.max_percent !== null && level.max_percent !== undefined) {
        return `${level.min_percent}% - ${level.max_percent}%`;
    }

    return `Score ${level.value}`;
}

type FactRowProps = {
    icon: typeof FileCheck2;
    label: string;
    value: string;
};

function FactRow({ icon: Icon, label, value }: FactRowProps) {
    return (
        <div className="bg-background flex items-start gap-3 rounded-2xl border p-3">
            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
                <Icon className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
                <p className="text-foreground text-sm font-medium">{value}</p>
            </div>
        </div>
    );
}

function getStartAction(
    appraisal: Appraisal,
    abilities: Record<string, boolean>,
    hasGoals: boolean,
    canOpenDevelopmentPlan: boolean,
): StartAction | null {
    if (abilities.planEdit && (!hasGoals || ['draft', 'goal_setting', 'sent_back'].includes(appraisal.status))) {
        return {
            href: route('performance.appraisals.plan', appraisal.id),
            label: hasGoals ? 'Review goals' : 'Set goals',
            description: 'Start by agreeing the goals and measurements.',
        };
    }

    if (hasGoals && abilities.selfAssessEdit && ['self_assessment_pending', 'sent_back'].includes(appraisal.status)) {
        return {
            href: route('performance.appraisals.self_assessment', appraisal.id),
            label: 'Do self assessment',
            description: 'Add your results, evidence, and self rating.',
        };
    }

    if (abilities.managerReviewEdit && ['self_assessment_submitted', 'manager_review_pending', 'sent_back'].includes(appraisal.status)) {
        return {
            href: route('performance.appraisals.manager_review', appraisal.id),
            label: 'Manager review',
            description: 'Review the employee input and add manager ratings.',
        };
    }

    if (abilities.approveEdit && ['manager_review_completed', 'approval_pending', 'sent_back'].includes(appraisal.status)) {
        return {
            href: route('performance.appraisals.approval', appraisal.id),
            label: 'Approve appraisal',
            description: 'Approve the appraisal or send it back for correction.',
        };
    }

    if (abilities.calibrateEdit && ['approved', 'calibration_pending', 'sent_back'].includes(appraisal.status)) {
        return {
            href: route('performance.appraisals.calibration', appraisal.id),
            label: 'Calibrate result',
            description: 'Confirm or adjust the final result.',
        };
    }

    if (abilities.finalizeEdit && appraisal.calibrated_at && appraisal.status !== 'finalized') {
        return {
            href: route('performance.appraisals.finalize', appraisal.id),
            label: 'Finalize appraisal',
            description: 'Lock the appraisal as the final record.',
        };
    }

    if (appraisal.status === 'finalized' && canOpenDevelopmentPlan) {
        return {
            href: route('performance.development_plans.edit', appraisal.id),
            label: appraisal.development_plan ? 'Update development plan' : 'Create development plan',
            description: 'Capture next steps after the appraisal is complete.',
        };
    }

    return null;
}

function getReviewPeriod(appraisal: Appraisal) {
    const start = appraisal.review_cycle?.start_date;
    const end = appraisal.review_cycle?.end_date;

    if (start || end) {
        return [formatDate(start, ''), formatDate(end, '')].filter(Boolean).join(' - ');
    }

    return appraisal.cycle_name_snapshot || '-';
}

function formatStatus(value: string) {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function isMeaningfulGoal(appraisal: Appraisal, objective: NonNullable<Appraisal['objectives']>[number]) {
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

    const templateItem = objective.template_item_id ? (appraisal.template?.items ?? []).find((item) => item.id === objective.template_item_id) : null;

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
