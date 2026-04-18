import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Appraisal } from '@/types/performance';
import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    ClipboardList,
    FilePenLine,
    FolderClock,
    Gauge,
    MessageSquareMore,
    Paperclip,
    PieChart,
    Sparkles,
    Target,
    Trophy,
    Workflow,
    type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

interface AppraisalWorkspaceChromeProps {
    appraisal: Appraisal;
    title: string;
    description: string;
    badgeLabel: string;
    badgeIcon?: LucideIcon;
    canEditGoals?: boolean;
    draftTag?: string | null;
}

export default function AppraisalWorkspaceChrome({
    appraisal,
    title,
    description,
    badgeLabel,
    badgeIcon: BadgeIcon = ClipboardList,
    canEditGoals = false,
    draftTag = null,
}: AppraisalWorkspaceChromeProps) {
    const objectiveCount = appraisal.objectives?.length ?? 0;
    const totalObjectiveWeight = (appraisal.objectives ?? []).reduce((sum, objective) => sum + Number(objective.weight ?? 0), 0);
    const commentCount = appraisal.comments?.length ?? 0;
    const evidenceCount = (appraisal.objectives ?? []).reduce((sum, objective) => sum + (objective.evidences?.length ?? 0), 0);
    const approvalCount = appraisal.approvals?.length ?? 0;
    const historyCount = appraisal.status_histories?.length ?? 0;
    const overallRating = appraisal.calibrated_overall_rating_level?.label ?? appraisal.overall_rating_level?.label ?? 'Not rated yet';
    const statusLabel = formatStatus(appraisal.status);
    const reopenedStageLabel = appraisal.reopened_stage ? formatStatus(appraisal.reopened_stage) : null;
    const hasGoals = (appraisal.objectives ?? []).some((objective) => {
        const title = objective.title?.trim() ?? '';
        const isGenericPlaceholderTitle = /^Objective\s+\d+$/i.test(title);

        return Boolean(
            !isGenericPlaceholderTitle &&
                (title ||
                    objective.goal_library_item_id ||
                    objective.kpi_measure?.trim() ||
                    objective.target_definition?.trim() ||
                    objective.evidence_source?.trim() ||
                    Number(objective.weight ?? 0) > 0 ||
                    objective.performance_achieved?.trim() ||
                    objective.employee_comment?.trim() ||
                    objective.manager_comment?.trim()),
        );
    });
    const workflowProgress = getWorkflowProgress(appraisal.status, appraisal.reopened_stage);

    return (
        <div className="space-y-4">
            <Card className="overflow-hidden border-0 shadow-lg">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background">
                    <CardContent className="space-y-6 p-6 lg:p-8">
                        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="secondary" className="w-fit gap-1.5 px-3 py-1">
                                        <BadgeIcon className="h-3.5 w-3.5" />
                                        {badgeLabel}
                                    </Badge>
                                    {draftTag ? (
                                        <Badge variant="outline" className="w-fit gap-1.5 border-amber-300 bg-amber-50 px-3 py-1 text-amber-800">
                                            <FilePenLine className="h-3.5 w-3.5" />
                                            {draftTag}
                                        </Badge>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">
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

                                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                                        {description}
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
                                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                {title}
                                            </div>
                                            <div className="mt-1 text-sm font-medium text-foreground">
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
                                    icon={Trophy}
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
                <MetricCard icon={Workflow} label="Approvals" value={String(approvalCount)} hint={`${historyCount} workflow updates`} />
            </div>
        </div>
    );
}

type MetricCardProps = {
    icon: LucideIcon;
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
                        <p className="text-sm font-medium text-muted-foreground">{label}</p>
                        <p className="text-2xl font-semibold tracking-tight">{value}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{hint}</p>
            </CardContent>
        </Card>
    );
}

type HighlightCardProps = {
    icon: LucideIcon;
    label: string;
    value: string;
    hint: string;
};

function HighlightCard({ icon: Icon, label, value, hint }: HighlightCardProps) {
    return (
        <div className="rounded-2xl border bg-background/85 p-4 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="text-base font-semibold text-foreground">{value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{hint}</p>
        </div>
    );
}

type InfoBadgeProps = {
    icon: LucideIcon;
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
