import { cn } from '@/lib/utils';

const steps = [
    'goal_setting',
    'self_assessment_pending',
    'manager_review_pending',
    'approval_pending',
    'approved',
    'finalized',
];

interface AppraisalWorkflowStepperProps {
    status: string;
}

export default function AppraisalWorkflowStepper({ status }: AppraisalWorkflowStepperProps) {
    const activeIndex = Math.max(steps.indexOf(status), 0);

    return (
        <div className="grid gap-3 md:grid-cols-6">
            {steps.map((step, index) => {
                const isComplete = index <= activeIndex;

                return (
                    <div
                        key={step}
                        className={cn(
                            'rounded-lg border px-3 py-2 text-sm',
                            isComplete ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground',
                        )}
                    >
                        <div className="font-medium">{step.replaceAll('_', ' ')}</div>
                        <div className="text-xs uppercase tracking-wide">{isComplete ? 'Reached' : 'Pending'}</div>
                    </div>
                );
            })}
        </div>
    );
}
