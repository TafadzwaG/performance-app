import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Appraisal } from '@/types/performance';
import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, BadgeCheck, CheckCircle2, ClipboardCheck, FileCheck2, ListChecks, Lock, Sparkles, Target, UserCheck } from 'lucide-react';
import type { ReactNode } from 'react';

export type AppraisalStepKey = 'goal_setting' | 'self_assessment' | 'manager_review' | 'approval' | 'calibration' | 'final_record';

export type AppraisalStartAction = {
    href: string;
    label: string;
    description: string;
};

type AppraisalStep = {
    key: AppraisalStepKey;
    title: string;
    description: string;
    href: string;
    canOpen: boolean;
    canNavigate: boolean;
    isComplete: boolean;
    icon: LucideIcon;
};

type Props = {
    appraisal: Appraisal;
    abilities: Record<string, boolean>;
    hasGoals: boolean;
    canOpenDevelopmentPlan: boolean;
    currentStepKey?: AppraisalStepKey;
    showStartButton?: boolean;
};

export default function AppraisalSteps({
    appraisal,
    abilities,
    hasGoals,
    canOpenDevelopmentPlan,
    currentStepKey,
    showStartButton = true,
}: Props) {
    const continueAction = getAppraisalContinueAction(appraisal, abilities, hasGoals, canOpenDevelopmentPlan);
    const steps = buildAppraisalSteps(appraisal, abilities, hasGoals, canOpenDevelopmentPlan);
    const pendingStepKey = getNextPendingStepKey(appraisal, abilities, hasGoals, canOpenDevelopmentPlan);

    return (
        <section className="mb-6 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="text-foreground flex items-center gap-2 text-base font-semibold">
                        <ListChecks className="text-primary h-4.5 w-4.5" />
                        Appraisal Steps
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">Follow the steps from left to right, or click a step to open it.</p>
                    <Link
                        href={`${route('performance.appraisals.show', appraisal.id)}?overview=1`}
                        className="text-primary mt-1 inline-block text-xs font-medium hover:underline"
                    >
                        View appraisal summary
                    </Link>
                </div>
                {showStartButton && continueAction ? (
                    <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 w-fit">
                        <Link href={continueAction.href}>
                            <ArrowRight className="mr-2 h-4 w-4" />
                            {continueAction.label}
                        </Link>
                    </Button>
                ) : null}
            </div>

            <div className="overflow-x-auto pb-2">
                <div className="grid min-w-[920px] grid-cols-6 items-start gap-3">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isCurrent = currentStepKey ? step.key === currentStepKey : step.key === pendingStepKey;

                        return (
                            <div key={step.key} className="relative">
                                {index < steps.length - 1 ? (
                                    <div className="bg-border absolute top-5 left-[calc(50%+24px)] h-px w-[calc(100%-24px)]" />
                                ) : null}
                                {step.canNavigate ? (
                                    <Link href={step.href} preserveScroll className="relative flex flex-col items-center text-center">
                                        <StepCircle step={step} isCurrent={isCurrent} Icon={Icon} />
                                        <StepLabels step={step} isCurrent={isCurrent} />
                                    </Link>
                                ) : (
                                    <div className="relative flex flex-col items-center text-center opacity-60">
                                        <StepCircle step={step} isCurrent={isCurrent} Icon={Icon} />
                                        <StepLabels step={step} isCurrent={isCurrent} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function StepCircle({
    step,
    isCurrent,
    Icon,
}: {
    step: AppraisalStep;
    isCurrent: boolean;
    Icon: LucideIcon;
}) {
    return (
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
    );
}

function StepLabels({ step, isCurrent }: { step: AppraisalStep; isCurrent: boolean }) {
    return (
        <>
            <span className="text-foreground mt-2 text-xs font-semibold">{step.title}</span>
            <span className="text-muted-foreground mt-1 text-[11px] leading-4">{step.description}</span>
            <span className="mt-2 flex min-h-5 items-center justify-center">
                {step.isComplete ? (
                    <Badge variant="secondary">Done</Badge>
                ) : isCurrent ? (
                    <Badge>Current</Badge>
                ) : step.canOpen ? (
                    <Badge variant="outline">Pending</Badge>
                ) : (
                    <Badge variant="outline" className="gap-1">
                        <Lock className="h-3 w-3" />
                        Locked
                    </Badge>
                )}
            </span>
        </>
    );
}

export function buildAppraisalSteps(
    appraisal: Appraisal,
    abilities: Record<string, boolean>,
    hasGoals: boolean,
    canOpenDevelopmentPlan: boolean,
): AppraisalStep[] {
    const sentBackTo = appraisal.status === 'sent_back' ? appraisal.reopened_stage : null;

    const steps: AppraisalStep[] = [
        {
            key: 'goal_setting',
            title: '1. Agree your goals',
            description: 'Write the work goals, how they will be measured, the target, evidence, and weight.',
            href: route('performance.appraisals.plan', appraisal.id),
            canOpen: abilities.plan,
            canNavigate: abilities.plan || isGoalSettingComplete(appraisal, hasGoals, sentBackTo),
            isComplete: isGoalSettingComplete(appraisal, hasGoals, sentBackTo),
            icon: Target,
        },
        {
            key: 'self_assessment',
            title: '2. Do your self assessment',
            description: 'Add what you achieved, upload evidence where needed, and rate your own performance.',
            href: route('performance.appraisals.self_assessment', appraisal.id),
            canOpen: abilities.selfAssess,
            canNavigate: abilities.selfAssess || isSelfAssessmentComplete(appraisal, sentBackTo),
            isComplete: isSelfAssessmentComplete(appraisal, sentBackTo),
            icon: ClipboardCheck,
        },
        {
            key: 'manager_review',
            title: '3. Manager review',
            description: 'Your manager reviews the evidence, adds comments, and gives manager ratings.',
            href: route('performance.appraisals.manager_review', appraisal.id),
            canOpen: abilities.managerReview,
            canNavigate: abilities.managerReview || isManagerReviewComplete(appraisal, sentBackTo),
            isComplete: isManagerReviewComplete(appraisal, sentBackTo),
            icon: UserCheck,
        },
        {
            key: 'approval',
            title: '4. Approval',
            description: 'The approving manager checks the appraisal and either approves it or sends it back.',
            href: route('performance.appraisals.approval', appraisal.id),
            canOpen: abilities.approve,
            canNavigate: abilities.approve || isApprovalComplete(appraisal, sentBackTo),
            isComplete: isApprovalComplete(appraisal, sentBackTo),
            icon: BadgeCheck,
        },
        {
            key: 'calibration',
            title: '5. Calibration',
            description: 'The calibration team confirms the final result before the appraisal is closed.',
            href: route('performance.appraisals.calibration', appraisal.id),
            canOpen: abilities.calibrate,
            canNavigate: abilities.calibrate || Boolean(appraisal.calibrated_at),
            isComplete: Boolean(appraisal.calibrated_at),
            icon: Sparkles,
        },
        {
            key: 'final_record',
            title: '6. Final record',
            description: 'The final appraisal is locked. A development plan can be created after this point.',
            href:
                appraisal.status === 'finalized'
                    ? route('performance.development_plans.edit', appraisal.id)
                    : route('performance.appraisals.finalize', appraisal.id),
            canOpen: abilities.finalize || (appraisal.status === 'finalized' && canOpenDevelopmentPlan),
            canNavigate:
                abilities.finalize ||
                (appraisal.status === 'finalized' && canOpenDevelopmentPlan) ||
                appraisal.status === 'finalized',
            isComplete: appraisal.status === 'finalized',
            icon: FileCheck2,
        },
    ];

    return steps;
}

export function getNextPendingStepKey(
    appraisal: Appraisal,
    abilities: Record<string, boolean>,
    hasGoals: boolean,
    canOpenDevelopmentPlan: boolean,
): AppraisalStepKey | null {
    const pending = buildAppraisalSteps(appraisal, abilities, hasGoals, canOpenDevelopmentPlan).find(
        (step) => !step.isComplete && step.canOpen,
    );

    return pending?.key ?? null;
}

export function isAppraisalStepComplete(
    stepKey: AppraisalStepKey,
    appraisal: Appraisal,
    abilities: Record<string, boolean>,
    hasGoals: boolean,
    canOpenDevelopmentPlan: boolean,
): boolean {
    return buildAppraisalSteps(appraisal, abilities, hasGoals, canOpenDevelopmentPlan).find((step) => step.key === stepKey)?.isComplete ?? false;
}

export function appraisalHasStarted(appraisal: Appraisal, hasGoals: boolean): boolean {
    return (
        Boolean(appraisal.goal_submitted_at) ||
        Boolean(appraisal.self_assessment_submitted_at) ||
        Boolean(appraisal.manager_reviewed_at) ||
        Boolean(appraisal.approved_at) ||
        Boolean(appraisal.calibrated_at) ||
        appraisal.status === 'finalized' ||
        (hasGoals && !['draft', 'goal_setting'].includes(appraisal.status))
    );
}

export function getStepContinueLabel(stepKey: AppraisalStepKey): string {
    switch (stepKey) {
        case 'goal_setting':
            return 'Goal Setting';
        case 'self_assessment':
            return 'Self Assessment';
        case 'manager_review':
            return 'Manager Review';
        case 'approval':
            return 'Approval';
        case 'calibration':
            return 'Calibration';
        case 'final_record':
            return 'Final Record';
        default:
            return 'Next Step';
    }
}

function canEditAppraisalStep(stepKey: AppraisalStepKey, abilities: Record<string, boolean>): boolean {
    switch (stepKey) {
        case 'goal_setting':
            return Boolean(abilities.planEdit);
        case 'self_assessment':
            return Boolean(abilities.selfAssessEdit);
        case 'manager_review':
            return Boolean(abilities.managerReviewEdit);
        case 'approval':
            return Boolean(abilities.approveEdit);
        case 'calibration':
            return Boolean(abilities.calibrateEdit);
        case 'final_record':
            return Boolean(abilities.finalizeEdit);
        default:
            return false;
    }
}

export function getAppraisalContinueAction(
    appraisal: Appraisal,
    abilities: Record<string, boolean>,
    hasGoals: boolean,
    canOpenDevelopmentPlan: boolean,
): AppraisalStartAction | null {
    const steps = buildAppraisalSteps(appraisal, abilities, hasGoals, canOpenDevelopmentPlan);
    const pending = steps.find((step) => !step.isComplete && canEditAppraisalStep(step.key, abilities));
    const hasStarted = appraisalHasStarted(appraisal, hasGoals);

    if (pending) {
        return {
            href: pending.href,
            label: hasStarted ? `Continue to ${getStepContinueLabel(pending.key)}` : 'Start my appraisal',
            description: pending.description,
        };
    }

    if (appraisal.status === 'finalized' && canOpenDevelopmentPlan) {
        return {
            href: route('performance.development_plans.edit', appraisal.id),
            label: appraisal.development_plan ? 'Continue to development plan' : 'Create development plan',
            description: 'Record development actions after the appraisal is finalized.',
        };
    }

    return null;
}

/** @deprecated Use getAppraisalContinueAction */
export function getAppraisalStartAction(
    appraisal: Appraisal,
    abilities: Record<string, boolean>,
    hasGoals: boolean,
    canOpenDevelopmentPlan: boolean,
): AppraisalStartAction | null {
    return getAppraisalContinueAction(appraisal, abilities, hasGoals, canOpenDevelopmentPlan);
}

function isGoalSettingComplete(appraisal: Appraisal, hasGoals: boolean, sentBackTo: string | null | undefined): boolean {
    if (sentBackTo === 'goal_setting') {
        return false;
    }

    if (appraisal.goal_submitted_at) {
        return true;
    }

    return hasGoals && !['draft', 'goal_setting'].includes(appraisal.status);
}

function isSelfAssessmentComplete(appraisal: Appraisal, sentBackTo: string | null | undefined): boolean {
    if (sentBackTo === 'self_assessment') {
        return false;
    }

    return Boolean(appraisal.self_assessment_submitted_at);
}

function isManagerReviewComplete(appraisal: Appraisal, sentBackTo: string | null | undefined): boolean {
    if (appraisal.status === 'manager_review_pending') {
        return false;
    }

    if (sentBackTo === 'manager_review' || sentBackTo === 'self_assessment' || sentBackTo === 'goal_setting') {
        return false;
    }

    return Boolean(appraisal.manager_reviewed_at);
}

function isApprovalComplete(appraisal: Appraisal, sentBackTo: string | null | undefined): boolean {
    if (sentBackTo === 'approval') {
        return false;
    }

    return Boolean(appraisal.approved_at);
}

type AppraisalStepSubmitActionsProps = {
    stepKey: AppraisalStepKey;
    appraisal: Appraisal;
    abilities: Record<string, boolean>;
    hasGoals: boolean;
    canOpenDevelopmentPlan: boolean;
    children: ReactNode;
};

export function AppraisalStepSubmitActions({
    stepKey,
    appraisal,
    abilities,
    hasGoals,
    canOpenDevelopmentPlan,
    children,
}: AppraisalStepSubmitActionsProps) {
    const stepComplete = isAppraisalStepComplete(stepKey, appraisal, abilities, hasGoals, canOpenDevelopmentPlan);
    const canEdit = canEditAppraisalStep(stepKey, abilities);

    if (!stepComplete && canEdit) {
        return <>{children}</>;
    }

    if (!stepComplete && !canEdit) {
        return (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                <Lock className="h-4 w-4 shrink-0" />
                <span>You can review this step here. Editing is only available when it is your current task.</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <Lock className="h-4 w-4 shrink-0" />
            <span>This step has been submitted. You can review it here, but submit actions are locked.</span>
        </div>
    );
}
