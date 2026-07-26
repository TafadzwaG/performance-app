import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ReviewCycle, ReviewCycleAutomationReadiness } from '@/types/performance';
import { AlertTriangle, PlayCircle, Rocket, Users } from 'lucide-react';

interface Props {
    reviewCycle: ReviewCycle;
    automationReadiness: ReviewCycleAutomationReadiness;
    onLaunch: () => void;
    onScrollToBlockers: () => void;
}

export default function CycleLaunchPanel({ reviewCycle, automationReadiness, onLaunch, onScrollToBlockers }: Props) {
    const isReady = automationReadiness.ready;
    const eligibleCount = automationReadiness.eligible;
    const blockerCount = automationReadiness.blockers.length;

    const handlePrimaryAction = () => {
        if (isReady) {
            onLaunch();
            return;
        }

        onScrollToBlockers();
    };

    return (
        <div
            className={
                isReady
                    ? 'rounded-xl border border-emerald-300/70 bg-emerald-50/50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/10'
                    : 'rounded-xl border border-amber-300/70 bg-amber-50/40 p-5 dark:border-amber-900/50 dark:bg-amber-950/10'
            }
        >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="gap-1.5 font-normal">
                            <Rocket className="size-3.5" />
                            Draft cycle launch
                        </Badge>
                        <Badge variant="secondary">{reviewCycle.code}</Badge>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">
                            {isReady ? 'Open cycle and assign all eligible employees' : 'Resolve blockers before opening this cycle'}
                        </h3>
                        <p className="text-muted-foreground mt-1 max-w-3xl text-sm leading-6">
                            {isReady ? (
                                <>
                                    Opening <span className="text-foreground font-medium">{reviewCycle.name}</span> will automatically create{' '}
                                    {automationReadiness.to_create} appraisal{automationReadiness.to_create === 1 ? '' : 's'} for eligible
                                    employees, snapshot {automationReadiness.objective_count} My KPI objective
                                    {automationReadiness.objective_count === 1 ? '' : 's'}, and move the cycle to open status.
                                </>
                            ) : (
                                <>
                                    This cycle cannot open yet because {blockerCount} employee
                                    {blockerCount === 1 ? '' : 's'} still need profile, manager, or My KPI fixes. Use the blocker list below to
                                    resolve them, then launch the cycle for all {eligibleCount} eligible employee
                                    {eligibleCount === 1 ? '' : 's'}.
                                </>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-stretch gap-2 sm:min-w-[260px]">
                    <Button type="button" size="lg" variant={isReady ? 'default' : 'secondary'} onClick={handlePrimaryAction}>
                        {isReady ? (
                            <>
                                <PlayCircle className="size-4" />
                                Open & assign {eligibleCount} employees
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="size-4" />
                                Review {blockerCount} blocker{blockerCount === 1 ? '' : 's'}
                            </>
                        )}
                    </Button>
                    <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs">
                        <Users className="size-3.5" />
                        {eligibleCount} eligible · {automationReadiness.excluded} excluded
                    </p>
                </div>
            </div>
        </div>
    );
}
