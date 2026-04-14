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
import { router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    BadgeCheck,
    CheckCircle2,
    ClipboardCheck,
    FilePenLine,
    Flag,
    ShieldCheck,
    UserCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const workflowCards = [
    { key: 'goal_setting', label: 'Goal Setting', icon: FilePenLine },
    { key: 'self_assessment_pending', label: 'Self Assessment', icon: ClipboardCheck },
    { key: 'manager_review_pending', label: 'Manager Review', icon: UserCheck },
    { key: 'approval_pending', label: 'Approval', icon: BadgeCheck },
    { key: 'approved', label: 'Approved', icon: ShieldCheck },
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
    approved: 'approved',
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

    const normalizedStage = status === 'sent_back' && reopenedStage ? reopenedStage : statusStageMap[status] ?? 'goal_setting';
    const activeIndex = Math.max(
        workflowCards.findIndex((card) => card.key === normalizedStage),
        0,
    );
    const approvedIndex = workflowCards.findIndex((card) => card.key === 'approved');

    const getStageLink = (stageKey: WorkflowCardKey) => {
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

        if (stageKey === 'approved') {
            return route('performance.appraisals.show', appraisalId);
        }

        return route('performance.appraisals.finalize', appraisalId);
    };

    const blockedReasonByStage = useMemo(() => {
        const map: Partial<Record<WorkflowCardKey, string>> = {};

        workflowCards.forEach((card, index) => {
            const hasPermission = !(stageAccess && stageAccess[card.key] === false);
            const reachedByWorkflow =
                index <= activeIndex ||
                (card.key === 'finalized' && activeIndex >= approvedIndex);

            if (!hasPermission) {
                map[card.key] = `You do not have permission to access the "${card.label}" stage for this appraisal.`;
                return;
            }

            if (!reachedByWorkflow) {
                map[card.key] = `You cannot open "${card.label}" yet. Complete the current stage first, then continue in workflow order.`;
            }
        });

        return map;
    }, [activeIndex, approvedIndex, stageAccess]);

    const onStageClick = (stageKey: WorkflowCardKey) => {
        const blockMessage = blockedReasonByStage[stageKey];

        if (blockMessage) {
            setBlockedDialogMessage(blockMessage);
            setBlockedDialogOpen(true);
            return;
        }

        const href = getStageLink(stageKey);
        if (href) {
            router.get(href);
        }
    };

    return (
        <>
            <div className="grid gap-2 md:grid-cols-6">
                {workflowCards.map((card, index) => {
                    const isCurrent = index === activeIndex;
                    const isComplete = index < activeIndex;
                    const isLast = index === workflowCards.length - 1;
                    const Icon = card.icon;
                    const blockedReason = blockedReasonByStage[card.key];
                    const statusLabel = isCurrent ? 'Current' : isComplete ? 'Completed' : 'Pending';
                    const circleContent = isComplete ? (
                        <CheckCircle2 className="h-4 w-4" />
                    ) : (
                        <span className="text-[11px] font-semibold">{index + 1}</span>
                    );

                    return (
                        <div key={card.key} className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => onStageClick(card.key)}
                                className={cn(
                                    'group w-full cursor-pointer rounded-lg border px-3 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
                                    isCurrent && 'border-primary bg-primary/15 text-foreground',
                                    isComplete && 'border-primary/60 bg-primary/10 text-primary',
                                    !isCurrent && !isComplete && 'border-border bg-card text-muted-foreground',
                                )}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={cn(
                                                'inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs',
                                                isCurrent && 'border-primary bg-primary text-primary-foreground',
                                                isComplete && 'border-primary/70 bg-primary/80 text-primary-foreground',
                                                !isCurrent && !isComplete && 'border-muted-foreground/30 bg-background text-muted-foreground',
                                            )}
                                        >
                                            {circleContent}
                                        </span>
                                        <Icon className={cn('h-4 w-4', isCurrent ? 'text-primary' : isComplete ? 'text-primary' : 'text-muted-foreground')} />
                                        <span className="font-medium">{card.label}</span>
                                    </div>
                                    <ArrowRight className="h-3.5 w-3.5 opacity-70 transition-transform group-hover:translate-x-0.5" />
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-wide">
                                    <span>{statusLabel}</span>
                                    {blockedReason ? <span className="text-destructive">Blocked</span> : null}
                                </div>
                            </button>

                            {!isLast ? (
                                <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground/60 md:block" />
                            ) : null}
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
