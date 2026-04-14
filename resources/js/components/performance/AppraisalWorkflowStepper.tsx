import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import {
    BadgeCheck,
    CheckCircle2,
    ClipboardCheck,
    FilePenLine,
    Flag,
    ShieldCheck,
    UserCheck,
} from 'lucide-react';

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
    const normalizedStage = status === 'sent_back' && reopenedStage ? reopenedStage : statusStageMap[status] ?? 'goal_setting';
    const activeIndex = Math.max(
        workflowCards.findIndex((card) => card.key === normalizedStage),
        0,
    );

    const getStageLink = (stageKey: WorkflowCardKey) => {
        if (!appraisalId || !showLinks) {
            return null;
        }
        if (stageAccess && stageAccess[stageKey] === false) {
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

    return (
        <div className="grid gap-3 md:grid-cols-6">
            {workflowCards.map((card, index) => {
                const isCurrent = index === activeIndex;
                const isComplete = index < activeIndex;
                const Icon = card.icon;
                const href = getStageLink(card.key);
                const statusLabel = isCurrent ? 'Current stage' : isComplete ? 'Completed' : 'Pending';
                const cardContent = (
                    <div
                        className={cn(
                            'rounded-lg border px-3 py-2 text-sm transition-colors',
                            isCurrent && 'border-primary bg-primary/15 text-foreground',
                            isComplete && 'border-primary/60 bg-primary/10 text-primary',
                            !isCurrent && !isComplete && 'border-border bg-card text-muted-foreground',
                        )}
                    >
                        <div className="flex items-center gap-2">
                            {isComplete ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : (
                                <Icon className={cn('h-4 w-4', isCurrent ? 'text-primary' : 'text-muted-foreground')} />
                            )}
                            <div className="font-medium">{card.label}</div>
                        </div>
                        <div className="mt-1 text-xs uppercase tracking-wide">{statusLabel}</div>
                    </div>
                );

                return (
                    <div key={card.key}>
                        {href ? (
                            <Link href={href} className="block cursor-pointer rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
                                {cardContent}
                            </Link>
                        ) : (
                            cardContent
                        )}
                    </div>
                );
            })}
        </div>
    );
}
