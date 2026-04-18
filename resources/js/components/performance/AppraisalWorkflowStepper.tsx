import { cn } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    BadgeCheck,
    ChartColumnIncreasing,
    CheckCircle2,
    ClipboardCheck,
    FileCheck2,
    FilePenLine,
    Flag,
    FolderClock,
    ShieldCheck,
    UserCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const workflowCards = [
    { key: 'goal_setting', label: 'Goal Setting', icon: FilePenLine },
    { key: 'self_assessment_pending', label: 'Self Assessment', icon: ClipboardCheck },
    { key: 'manager_review_pending', label: 'Manager Review', icon: UserCheck },
    { key: 'approval_pending', label: 'Approval', icon: BadgeCheck },
    { key: 'calibration_pending', label: 'Calibration', icon: ChartColumnIncreasing },
    { key: 'finalized', label: 'Finalized', icon: Flag },
] as const;

type WorkflowCardKey = (typeof workflowCards)[number]['key'];

const statusStageMap: Record<string, WorkflowCardKey> = {
    draft: 'goal_setting',
    goal_setting: 'goal_setting',
    self_assessment_pending: 'self_assessment_pending',
    self_assessment_submitted: 'manager_review_pending',
    manager_review_pending: 'manager_review_pending',
    manager_review_completed: 'approval_pending',
    approval_pending: 'approval_pending',
    approved: 'calibration_pending',
    calibration_pending: 'calibration_pending',
    sent_back: 'goal_setting',
    finalized: 'finalized',
};

interface AppraisalWorkflowStepperProps {
    status: string;
    appraisalId?: number;
    reopenedStage?: string | null;
    showLinks?: boolean;
    stageAccess?: Partial<Record<WorkflowCardKey, boolean>>;
}

export default function AppraisalWorkflowStepper({
    status,
    appraisalId,
    reopenedStage,
    showLinks = true,
    stageAccess,
}: AppraisalWorkflowStepperProps) {
    const [blockedDialogOpen, setBlockedDialogOpen] = useState(false);
    const [blockedDialogMessage, setBlockedDialogMessage] = useState('');

    const normalizedStage =
        status === 'sent_back' && reopenedStage
            ? normalizeReopenedStage(reopenedStage)
            : statusStageMap[status] ?? 'goal_setting';

    const activeIndex = Math.max(
        workflowCards.findIndex((card) => card.key === normalizedStage),
        0,
    );
    const blockedReasonByStage = useMemo(() => {
        const map: Partial<Record<WorkflowCardKey, string>> = {};

        workflowCards.forEach((card, index) => {
            const hasPermission = !(stageAccess && stageAccess[card.key] === false);
            const reachedByWorkflow =
                index <= activeIndex;

            if (!hasPermission) {
                map[card.key] = `You do not have permission to access the "${card.label}" stage for this appraisal.`;
                return;
            }

            if (!reachedByWorkflow) {
                map[card.key] = `You cannot open "${card.label}" yet. Complete the current stage first, then continue in workflow order.`;
            }
        });

        return map;
    }, [activeIndex, stageAccess]);

    const onStageClick = (stageKey: WorkflowCardKey) => {
        const blockedMessage = blockedReasonByStage[stageKey];

        if (blockedMessage) {
            setBlockedDialogMessage(blockedMessage);
            setBlockedDialogOpen(true);
            return;
        }

        const href = getStageLink(stageKey, appraisalId, showLinks);
        if (href) {
            router.get(href);
        }
    };

    return (
        <>
            <div className="space-y-3">
                {workflowCards.map((card, index) => {
                    const Icon = card.icon;
                    const isCurrent = index === activeIndex;
                    const isComplete = index < activeIndex;
                    const isUpcoming = index > activeIndex;
                    const isReopened = reopenedStage === card.key || normalizeReopenedStage(reopenedStage) === card.key;
                    const blockedReason = blockedReasonByStage[card.key];
                    const canOpen = !blockedReason && getStageLink(card.key, appraisalId, showLinks);

                    return (
                        <div key={card.key} className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                                <div
                                    className={cn(
                                        'flex h-10 w-10 items-center justify-center rounded-full border',
                                        isCurrent && 'border-primary bg-primary text-primary-foreground',
                                        isComplete && 'border-primary/20 bg-primary/10 text-primary',
                                        !isCurrent && !isComplete && 'border-border bg-muted text-muted-foreground',
                                    )}
                                >
                                    {isComplete ? (
                                        <CheckCircle2 className="h-4.5 w-4.5" />
                                    ) : (
                                        <Icon className="h-4.5 w-4.5" />
                                    )}
                                </div>
                                {index < workflowCards.length - 1 ? (
                                    <div className="mt-2 h-8 w-px bg-border" />
                                ) : null}
                            </div>

                            <button
                                type="button"
                                onClick={() => onStageClick(card.key)}
                                className={cn(
                                    'min-w-0 flex-1 rounded-2xl border bg-background p-3 text-left transition-colors',
                                    'cursor-pointer hover:border-primary/40',
                                    isCurrent && 'border-primary/35 shadow-sm',
                                    isComplete && 'border-primary/20',
                                    isUpcoming && 'border-border',
                                )}
                            >
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium text-foreground">{card.label}</span>
                                    {isCurrent ? <Badge className="px-2 py-0.5">Current</Badge> : null}
                                    {isComplete ? (
                                        <Badge variant="secondary" className="gap-1 px-2 py-0.5">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Complete
                                        </Badge>
                                    ) : null}
                                    {isUpcoming ? (
                                        <Badge variant="outline" className="px-2 py-0.5">
                                            Pending
                                        </Badge>
                                    ) : null}
                                    {isReopened ? (
                                        <Badge variant="outline" className="gap-1 px-2 py-0.5">
                                            <FolderClock className="h-3 w-3" />
                                            Reopened
                                        </Badge>
                                    ) : null}
                                </div>

                                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                    <span>
                                        {isCurrent
                                            ? 'This is the active appraisal stage.'
                                            : isComplete
                                              ? 'This stage has been completed.'
                                              : 'This stage is upcoming.'}
                                    </span>

                                    {canOpen ? (
                                        <Link
                                            href={canOpen}
                                            className="inline-flex cursor-pointer items-center text-xs font-medium text-primary transition-colors hover:text-primary/80"
                                        >
                                            Open
                                        </Link>
                                    ) : blockedReason ? (
                                        <span className="text-xs font-medium text-destructive">Blocked</span>
                                    ) : null}
                                </div>
                            </button>
                        </div>
                    );
                })}
            </div>

            <AlertDialog open={blockedDialogOpen} onOpenChange={setBlockedDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            Stage Not Available
                        </AlertDialogTitle>
                        <AlertDialogDescription>{blockedDialogMessage}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction>OK</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function getStageLink(stageKey: WorkflowCardKey, appraisalId?: number, showLinks = true) {
    if (!appraisalId || !showLinks) {
        return null;
    }

    if (stageKey === 'goal_setting') {
        return route('performance.appraisals.plan', appraisalId);
    }

    if (stageKey === 'self_assessment_pending') {
        return route('performance.appraisals.self_assessment', appraisalId);
    }

    if (stageKey === 'manager_review_pending') {
        return route('performance.appraisals.manager_review', appraisalId);
    }

    if (stageKey === 'approval_pending') {
        return route('performance.appraisals.approval', appraisalId);
    }

    if (stageKey === 'calibration_pending') {
        return route('performance.appraisals.calibration', appraisalId);
    }

    return route('performance.appraisals.finalize', appraisalId);
}

function normalizeReopenedStage(reopenedStage?: string | null): WorkflowCardKey | null {
    if (!reopenedStage) {
        return null;
    }

    if (reopenedStage === 'self_assessment') {
        return 'self_assessment_pending';
    }

    if (reopenedStage === 'manager_review') {
        return 'manager_review_pending';
    }

    if (reopenedStage === 'approval') {
        return 'approval_pending';
    }

    if (reopenedStage === 'calibration') {
        return 'calibration_pending';
    }

    if (reopenedStage === 'goal_setting') {
        return 'goal_setting';
    }

    if (reopenedStage === 'finalization') {
        return 'finalized';
    }

    return reopenedStage as WorkflowCardKey;
}
