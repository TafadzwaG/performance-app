import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { Appraisal } from '@/types/performance';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, BadgeCheck, CheckCircle2, ClipboardCheck, FileCheck2, FilePenLine, Flag, Sparkles, UserCheck } from 'lucide-react';

interface Props {
    appraisal: Appraisal;
    abilities: Record<string, boolean>;
}

type StepKey = 'goal_setting' | 'self_assessment' | 'manager_review' | 'approval' | 'calibration' | 'final_record';

type WizardStep = {
    key: StepKey;
    title: string;
    plainTitle: string;
    description: string;
    href: string;
    canOpen: boolean;
    complete: boolean;
    icon: typeof FilePenLine;
};

const breadcrumbs = (appraisal: Appraisal): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Appraisals', href: route('performance.appraisals.index') },
    { title: appraisal.employee_name_snapshot, href: route('performance.appraisals.show', appraisal.id) },
    { title: 'Step Wizard', href: route('performance.appraisals.step_wizard', appraisal.id) },
];

export default function StepWizard({ appraisal, abilities }: Props) {
    const { auth } = usePage<SharedData>().props;
    const canOpenDevelopmentPlan =
        auth.permissions.includes('performance.development_plans.view') || auth.permissions.includes('performance.development_plans.update');
    const hasGoals = (appraisal.objectives ?? []).some((objective) => isMeaningfulGoal(appraisal, objective));
    const currentKey = getCurrentStepKey(appraisal.status, appraisal.reopened_stage);
    const steps = buildWizardSteps(appraisal, abilities, hasGoals, canOpenDevelopmentPlan);
    const currentIndex = Math.max(
        steps.findIndex((step) => step.key === currentKey),
        0,
    );
    const progressPercent = Math.round((steps.filter((step) => step.complete).length / steps.length) * 100);
    const nextStep = steps.find((step, index) => index >= currentIndex && step.canOpen) ?? steps.find((step) => step.canOpen) ?? null;

    return (
        <PerformancePage
            title="Appraisal Step Wizard"
            description="Follow each appraisal stage in order, starting with Goal Setting."
            breadcrumbs={breadcrumbs(appraisal)}
            secondaryActions={
                <Button asChild variant="outline">
                    <Link href={route('performance.appraisals.show', appraisal.id)}>Back to appraisal</Link>
                </Button>
            }
        >
            <div className="space-y-6">
                <section className="space-y-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary">
                                    Step {currentIndex + 1} of {steps.length}
                                </Badge>
                                <Badge variant="outline">{progressPercent}% complete</Badge>
                            </div>
                            <h1 className="text-foreground mt-3 text-2xl font-semibold tracking-tight">{appraisal.employee_name_snapshot}</h1>
                            <p className="text-muted-foreground mt-1 text-sm">{appraisal.cycle_name_snapshot}</p>
                        </div>

                        {nextStep ? (
                            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 w-fit">
                                <Link href={nextStep.href}>
                                    {nextStep.key === 'goal_setting' ? 'Start Goal Setting' : `Continue: ${nextStep.plainTitle}`}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        ) : null}
                    </div>

                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                        <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                    </div>
                </section>

                <section className="overflow-x-auto pb-2">
                    <div className="grid min-w-[960px] grid-cols-6 items-start gap-3">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isCurrent = index === currentIndex;

                            return (
                                <div key={step.key} className="relative">
                                    {index < steps.length - 1 ? (
                                        <div className="bg-border absolute top-6 left-[calc(50%+28px)] h-px w-[calc(100%-28px)]" />
                                    ) : null}
                                    <div className="relative flex flex-col items-center text-center">
                                        <div
                                            className={`bg-background flex h-12 w-12 items-center justify-center rounded-full border ${
                                                isCurrent
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : step.complete
                                                      ? 'border-primary/25 text-primary'
                                                      : 'text-muted-foreground'
                                            }`}
                                        >
                                            {step.complete ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                                        </div>
                                        <div className="text-foreground mt-3 text-xs font-semibold">{step.title}</div>
                                        <div className="text-muted-foreground mt-1 text-[11px] leading-4">{step.description}</div>
                                        <div className="mt-2 min-h-5">
                                            {isCurrent ? (
                                                <Badge>Current</Badge>
                                            ) : step.complete ? (
                                                <Badge variant="secondary">Done</Badge>
                                            ) : (
                                                <Badge variant="outline">Waiting</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <Card className="border-0 shadow-md">
                    <CardHeader className="bg-muted/20 border-b">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Flag className="h-4.5 w-4.5" />
                            Current Step
                        </CardTitle>
                        <CardDescription>Open the available stage and complete it before moving to the next step.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isCurrent = index === currentIndex;

                            return (
                                <div
                                    key={step.key}
                                    className={`rounded-lg border p-4 ${isCurrent ? 'border-primary/40 bg-primary/5' : 'bg-background'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="bg-background text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border">
                                            <Icon className="h-4.5 w-4.5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-foreground text-sm font-semibold">{step.title}</h2>
                                                {isCurrent ? <Badge>Current</Badge> : null}
                                            </div>
                                            <p className="text-muted-foreground mt-2 text-sm leading-6">{step.description}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        {step.canOpen ? (
                                            <Button asChild size="sm">
                                                <Link href={step.href}>
                                                    Open {step.plainTitle}
                                                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button size="sm" variant="outline" disabled>
                                                Not available yet
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>
        </PerformancePage>
    );
}

function buildWizardSteps(
    appraisal: Appraisal,
    abilities: Record<string, boolean>,
    hasGoals: boolean,
    canOpenDevelopmentPlan: boolean,
): WizardStep[] {
    return [
        {
            key: 'goal_setting',
            title: '1. Goal Setting',
            plainTitle: 'Goal Setting',
            description: 'Agree the goals, measures, targets, evidence, and weight.',
            href: route('performance.appraisals.plan', appraisal.id),
            canOpen: abilities.plan,
            complete: hasGoals && !['draft', 'goal_setting'].includes(appraisal.status),
            icon: FilePenLine,
        },
        {
            key: 'self_assessment',
            title: '2. Self Assessment',
            plainTitle: 'Self Assessment',
            description: 'Capture achievements, evidence, comments, and self ratings.',
            href: route('performance.appraisals.self_assessment', appraisal.id),
            canOpen: hasGoals && abilities.selfAssess,
            complete: Boolean(appraisal.self_assessment_submitted_at),
            icon: ClipboardCheck,
        },
        {
            key: 'manager_review',
            title: '3. Manager Review',
            plainTitle: 'Manager Review',
            description: 'Manager reviews results and captures manager ratings.',
            href: route('performance.appraisals.manager_review', appraisal.id),
            canOpen: abilities.managerReview,
            complete: Boolean(appraisal.manager_reviewed_at),
            icon: UserCheck,
        },
        {
            key: 'approval',
            title: '4. Approval',
            plainTitle: 'Approval',
            description: 'Approving manager approves the appraisal or sends it back.',
            href: route('performance.appraisals.approval', appraisal.id),
            canOpen: abilities.approve,
            complete: Boolean(appraisal.approved_at),
            icon: BadgeCheck,
        },
        {
            key: 'calibration',
            title: '5. Calibration',
            plainTitle: 'Calibration',
            description: 'Calibration confirms or adjusts the final result.',
            href: route('performance.appraisals.calibration', appraisal.id),
            canOpen: abilities.calibrate,
            complete: Boolean(appraisal.calibrated_at),
            icon: Sparkles,
        },
        {
            key: 'final_record',
            title: '6. Final Record',
            plainTitle: 'Final Record',
            description: 'Finalize the appraisal and create the development plan.',
            href:
                appraisal.status === 'finalized'
                    ? route('performance.development_plans.edit', appraisal.id)
                    : route('performance.appraisals.finalize', appraisal.id),
            canOpen: abilities.finalize || (appraisal.status === 'finalized' && canOpenDevelopmentPlan),
            complete: appraisal.status === 'finalized',
            icon: FileCheck2,
        },
    ];
}

function getCurrentStepKey(status: string, reopenedStage?: string | null): StepKey {
    if (status === 'sent_back' && reopenedStage) {
        if (reopenedStage === 'goal_setting') return 'goal_setting';
        if (reopenedStage === 'self_assessment') return 'self_assessment';
        if (reopenedStage === 'manager_review') return 'manager_review';
        if (reopenedStage === 'approval') return 'approval';
        if (reopenedStage === 'calibration') return 'calibration';
    }

    const map: Record<string, StepKey> = {
        draft: 'goal_setting',
        goal_setting: 'goal_setting',
        self_assessment_pending: 'self_assessment',
        self_assessment_submitted: 'manager_review',
        manager_review_pending: 'manager_review',
        manager_review_completed: 'approval',
        approval_pending: 'approval',
        approved: 'calibration',
        calibration_pending: 'calibration',
        finalized: 'final_record',
    };

    return map[status] ?? 'goal_setting';
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
