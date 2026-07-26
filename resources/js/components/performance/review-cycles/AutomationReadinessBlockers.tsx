import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EmployeeMatchingKpisModal from '@/components/performance/review-cycles/EmployeeMatchingKpisModal';
import { cn } from '@/lib/utils';
import type { Option, ReviewCycleAutomationReadiness } from '@/types/performance';
import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    Briefcase,
    ChevronDown,
    ChevronUp,
    Target,
    UserRound,
    Users,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ComponentType } from 'react';

type Blocker = ReviewCycleAutomationReadiness['blockers'][number];

interface ReasonMeta {
    icon: ComponentType<{ className?: string }>;
    tone: string;
}

function getReasonMeta(reason: string): ReasonMeta {
    if (reason.includes('KPI') || reason.includes('objectives') || reason.includes('My KPI')) {
        return {
            icon: Target,
            tone: 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100',
        };
    }

    if (reason.includes('manager')) {
        return {
            icon: Users,
            tone: 'border-orange-200 bg-orange-50 text-orange-950 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-100',
        };
    }

    if (reason.includes('Department') || reason.includes('Job title')) {
        return {
            icon: Briefcase,
            tone: 'border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100',
        };
    }

    return {
        icon: AlertTriangle,
        tone: 'border-border bg-muted/40 text-foreground',
    };
}

function needsKpiAction(reasons: string[]) {
    return reasons.some((reason) => reason.includes('KPI') || reason.includes('objectives') || reason.includes('My KPI'));
}

function needsProfileAction(reasons: string[]) {
    return reasons.some((reason) => ['Department', 'Job title', 'manager'].some((token) => reason.includes(token)));
}

function getInitials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

function IssueSummaryChips({ blockers }: { blockers: Blocker[] }) {
    const counts = useMemo(() => {
        const summary = {
            kpi: 0,
            profile: 0,
            manager: 0,
            other: 0,
        };

        blockers.forEach((blocker) => {
            blocker.reasons.forEach((reason) => {
                if (reason.includes('KPI') || reason.includes('objectives') || reason.includes('My KPI')) {
                    summary.kpi += 1;
                    return;
                }

                if (reason.includes('manager')) {
                    summary.manager += 1;
                    return;
                }

                if (reason.includes('Department') || reason.includes('Job title')) {
                    summary.profile += 1;
                    return;
                }

                summary.other += 1;
            });
        });

        return summary;
    }, [blockers]);

    const chips = [
        counts.kpi > 0 ? { label: `${counts.kpi} KPI issue${counts.kpi === 1 ? '' : 's'}`, icon: Target } : null,
        counts.profile > 0 ? { label: `${counts.profile} profile issue${counts.profile === 1 ? '' : 's'}`, icon: Briefcase } : null,
        counts.manager > 0 ? { label: `${counts.manager} manager issue${counts.manager === 1 ? '' : 's'}`, icon: Users } : null,
        counts.other > 0 ? { label: `${counts.other} other issue${counts.other === 1 ? '' : 's'}`, icon: AlertTriangle } : null,
    ].filter(Boolean) as Array<{ label: string; icon: ComponentType<{ className?: string }> }>;

    if (chips.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
                <Badge key={chip.label} variant="outline" className="gap-1.5 px-2.5 py-1 font-normal">
                    <chip.icon className="size-3.5" />
                    {chip.label}
                </Badge>
            ))}
        </div>
    );
}

function GlobalBlockerAlert({ blocker }: { blocker: Blocker }) {
    return (
        <div className="rounded-xl border border-amber-300/80 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
            <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                    <AlertTriangle className="size-4" />
                </div>
                <div className="min-w-0 space-y-2">
                    <p className="font-medium text-amber-950 dark:text-amber-50">Cycle configuration blocker</p>
                    <ul className="space-y-1.5">
                        {blocker.reasons.map((reason) => (
                            <li key={reason} className="text-sm text-amber-900/90 dark:text-amber-100/90">
                                {reason}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

function EmployeeBlockerRow({ blocker, onReviewKpis }: { blocker: Blocker; onReviewKpis: (blocker: Blocker) => void }) {
    const showKpiAction = needsKpiAction(blocker.reasons);
    const showProfileAction = needsProfileAction(blocker.reasons);

    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/20">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="bg-muted text-muted-foreground flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                        {getInitials(blocker.employee_name)}
                    </div>
                    <div className="min-w-0 space-y-3">
                        <div>
                            {blocker.employee_profile_id ? (
                                <Link
                                    href={route('performance.employees.edit', blocker.employee_profile_id)}
                                    className="text-foreground hover:text-primary font-semibold hover:underline"
                                >
                                    {blocker.employee_name}
                                </Link>
                            ) : (
                                <p className="text-foreground font-semibold">{blocker.employee_name}</p>
                            )}
                            {blocker.employee_number ? (
                                <p className="text-muted-foreground mt-0.5 text-xs tracking-wide uppercase">
                                    Employee #{blocker.employee_number}
                                </p>
                            ) : null}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {blocker.reasons.map((reason) => {
                                const meta = getReasonMeta(reason);
                                const Icon = meta.icon;

                                return (
                                    <span
                                        key={reason}
                                        className={cn(
                                            'inline-flex max-w-full items-start gap-1.5 rounded-full border px-2.5 py-1 text-xs leading-5',
                                            meta.tone,
                                        )}
                                    >
                                        <Icon className="mt-0.5 size-3.5 shrink-0" />
                                        <span>{reason}</span>
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                    {showProfileAction && blocker.employee_profile_id ? (
                        <Button asChild variant="outline" size="sm">
                            <Link href={route('performance.employees.edit', blocker.employee_profile_id)}>
                                <UserRound className="size-4" />
                                Edit profile
                            </Link>
                        </Button>
                    ) : null}
                    {showKpiAction ? (
                        <Button type="button" variant="secondary" size="sm" onClick={() => onReviewKpis(blocker)}>
                            <Target className="size-4" />
                            Review KPIs
                        </Button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

interface Props {
    blockers: Blocker[];
    perspectiveOptions: Option[];
    templateLimits?: ReviewCycleAutomationReadiness['template'];
}

const INITIAL_VISIBLE = 5;

export default function AutomationReadinessBlockers({ blockers, perspectiveOptions, templateLimits = null }: Props) {
    const [expanded, setExpanded] = useState(false);
    const [kpiModalOpen, setKpiModalOpen] = useState(false);
    const [selectedBlocker, setSelectedBlocker] = useState<Blocker | null>(null);

    const openKpiModal = (blocker: Blocker) => {
        setSelectedBlocker(blocker);
        setKpiModalOpen(true);
    };

    useEffect(() => {
        if (!selectedBlocker?.employee_profile_id) {
            return;
        }

        const updated = blockers.find((blocker) => blocker.employee_profile_id === selectedBlocker.employee_profile_id);
        if (updated) {
            setSelectedBlocker(updated);
        }
    }, [blockers, selectedBlocker?.employee_profile_id]);

    const globalBlockers = blockers.filter((blocker) => !blocker.employee_profile_id);
    const employeeBlockers = blockers.filter((blocker) => blocker.employee_profile_id);
    const visibleEmployeeBlockers = expanded ? employeeBlockers : employeeBlockers.slice(0, INITIAL_VISIBLE);
    const hiddenCount = Math.max(0, employeeBlockers.length - INITIAL_VISIBLE);

    if (blockers.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border border-amber-300/70 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/10 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                        <AlertTriangle className="size-4.5" />
                    </div>
                    <div>
                        <p className="font-semibold text-amber-950 dark:text-amber-50">Action required before automation</p>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {employeeBlockers.length > 0
                                ? `${employeeBlockers.length} employee${employeeBlockers.length === 1 ? '' : 's'} need fixes before this cycle can open or sync.`
                                : 'Resolve the cycle-level blockers below before continuing.'}
                        </p>
                    </div>
                </div>
                {employeeBlockers.length > 0 ? (
                    <Badge variant="outline" className="w-fit border-amber-300 bg-background/80 text-amber-900 dark:text-amber-100">
                        {employeeBlockers.length} blocked
                    </Badge>
                ) : null}
            </div>

            {employeeBlockers.length > 0 ? <IssueSummaryChips blockers={employeeBlockers} /> : null}

            {globalBlockers.map((blocker, index) => (
                <GlobalBlockerAlert key={`global-${index}`} blocker={blocker} />
            ))}

            {employeeBlockers.length > 0 ? (
                <div className="space-y-3">
                    {visibleEmployeeBlockers.map((blocker) => (
                        <EmployeeBlockerRow key={blocker.employee_profile_id} blocker={blocker} onReviewKpis={openKpiModal} />
                    ))}

                    {hiddenCount > 0 ? (
                        <div className="flex justify-center pt-1">
                            <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded((value) => !value)}>
                                {expanded ? (
                                    <>
                                        <ChevronUp className="size-4" />
                                        Show fewer blockers
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="size-4" />
                                        Show {hiddenCount} more blocker{hiddenCount === 1 ? '' : 's'}
                                        <ArrowRight className="size-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : null}
                </div>
            ) : null}

            <EmployeeMatchingKpisModal
                blocker={selectedBlocker}
                open={kpiModalOpen}
                perspectiveOptions={perspectiveOptions}
                templateLimits={templateLimits}
                onOpenChange={setKpiModalOpen}
            />
        </div>
    );
}
