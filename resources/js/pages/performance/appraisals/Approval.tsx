import AppraisalSteps, { AppraisalStepSubmitActions } from '@/components/performance/AppraisalSteps';
import ApprovalTimeline from '@/components/performance/ApprovalTimeline';
import PerformancePage from '@/components/performance/PerformancePage';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { Appraisal } from '@/types/performance';
import { useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    BadgeCheck,
    CheckCircle2,
    ClipboardCheck,
    CornerUpLeft,
    Loader2,
    MessageSquare,
    Send,
    ShieldX,
    History,
    Sparkles,
    Undo2,
    Workflow,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
    appraisal: Appraisal;
    abilities: Record<string, boolean>;
}

type ApprovalDecision = 'approve' | 'send_back' | 'reject';
type ReopenedStage = 'manager_review' | 'self_assessment' | 'goal_setting';

type ApprovalForm = {
    decision: ApprovalDecision;
    comment: string;
    reopened_stage: ReopenedStage;
};

type ValidationIssue = {
    key: string;
    title: string;
    description: string;
    currentValue?: string | null;
};

const breadcrumbs = (appraisal: Appraisal): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Appraisals', href: route('performance.appraisals.index') },
    { title: appraisal.employee_name_snapshot, href: route('performance.appraisals.show', appraisal.id) },
    { title: 'Approval', href: route('performance.appraisals.approval', appraisal.id) },
];

export default function Approval({ appraisal, abilities }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [draftSaved, setDraftSaved] = useState(false);
    const [submitAlertOpen, setSubmitAlertOpen] = useState(false);
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
    const hasGoals = (appraisal.objectives ?? []).length > 0;
    const canOpenDevelopmentPlan =
        auth.permissions.includes('performance.development_plans.view') || auth.permissions.includes('performance.development_plans.update');

    const { data, setData, post, processing } = useForm<ApprovalForm>({
        decision: 'approve',
        comment: '',
        reopened_stage: 'manager_review',
    });

    const hydratedFromStorage = useRef(false);
    const draftStorageKey = useMemo(() => `performance:appraisals:approval:draft:${appraisal.id}`, [appraisal.id]);

    const initialDraftSnapshot = useMemo(
        () =>
            JSON.stringify({
                decision: 'approve',
                comment: '',
                reopened_stage: 'manager_review',
            }),
        [],
    );

    useEffect(() => {
        if (typeof window === 'undefined' || hydratedFromStorage.current) return;

        const raw = window.localStorage.getItem(draftStorageKey);
        if (!raw) {
            hydratedFromStorage.current = true;
            return;
        }

        try {
            const parsed = JSON.parse(raw) as Partial<ApprovalForm>;
            (Object.keys(parsed) as Array<keyof ApprovalForm>).forEach((key) => {
                const value = parsed[key];
                if (value !== undefined) setData(key, value);
            });
            setDraftSaved(true);
        } catch {
            window.localStorage.removeItem(draftStorageKey);
        } finally {
            hydratedFromStorage.current = true;
        }
    }, [draftStorageKey, setData]);

    useEffect(() => {
        if (typeof window === 'undefined' || !hydratedFromStorage.current) return;

        const serialized = JSON.stringify(data);
        if (serialized === initialDraftSnapshot) {
            window.localStorage.removeItem(draftStorageKey);
            setDraftSaved(false);
            return;
        }

        window.localStorage.setItem(draftStorageKey, serialized);
        setDraftSaved(true);
    }, [data, draftStorageKey, initialDraftSnapshot]);

    const getValidationIssues = (): ValidationIssue[] => {
        const issues: ValidationIssue[] = [];

        if (!data.decision) {
            issues.push({
                key: 'decision',
                title: 'Decision is required',
                description: 'Choose whether you want to approve, send back, or reject this appraisal before submitting.',
            });
        }

        if (!String(data.comment ?? '').trim()) {
            issues.push({
                key: 'comment',
                title: `${formatDecisionLabel(data.decision)} comment is required`,
                description: `Add a clear approver comment explaining your ${formatDecisionLabel(data.decision).toLowerCase()} decision before submitting.`,
                currentValue: 'No comment entered',
            });
        }

        if (data.decision !== 'approve' && !String(data.reopened_stage ?? '').trim()) {
            issues.push({
                key: 'reopened_stage',
                title: 'Return stage is required',
                description: 'Select the stage the appraisal should go back to before submitting a send back or reject decision.',
                currentValue: 'No stage selected',
            });
        }

        return issues;
    };

    const handleSubmitDecision = () => {
        const issues = getValidationIssues();

        if (issues.length > 0) {
            setValidationIssues(issues);
            setSubmitAlertOpen(true);
            return;
        }

        setActionModalOpen(true);

        post(route('performance.appraisals.approval.store', appraisal.id), {
            onSuccess: () => {
                if (typeof window !== 'undefined') {
                    window.localStorage.removeItem(draftStorageKey);
                }
                setDraftSaved(false);
            },
            onFinish: () => setActionModalOpen(false),
            onError: () => setActionModalOpen(false),
        });
    };

    const actionModal = getActionModalContent(data.decision, data.reopened_stage);

    const decisionMeta = getDecisionMeta(data.decision);

    return (
        <PerformancePage
            title="Approval"
            description="Approve, reject, or return the appraisal to an earlier stage."
            breadcrumbs={breadcrumbs(appraisal)}
        >
            <AppraisalSteps
                appraisal={appraisal}
                abilities={abilities}
                hasGoals={hasGoals}
                canOpenDevelopmentPlan={canOpenDevelopmentPlan}
                currentStepKey="approval"
                showStartButton={false}
            />

            <div className="grid gap-6 xl:grid-cols-12">
                <div className="space-y-6 xl:col-span-12">
                    <Card className="overflow-hidden border-0 shadow-md">
                        <div className="from-primary/10 via-primary/5 to-background bg-gradient-to-r">
                            <CardHeader className="gap-4 border-b bg-transparent">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="space-y-3">
                                        <Badge variant="secondary" className="w-fit gap-1.5 px-3 py-1">
                                            <Sparkles className="h-3.5 w-3.5" />
                                            Final decision panel
                                        </Badge>
                                        <div className="space-y-1.5">
                                            <CardTitle className="flex items-center gap-2 text-xl">
                                                <decisionMeta.icon className="h-5 w-5" />
                                                Approval Decision
                                            </CardTitle>
                                            <CardDescription className="max-w-2xl text-sm leading-6">
                                                Choose the final decision, add a clear approver note, and submit the appraisal to complete this stage
                                                and send it to calibration.
                                            </CardDescription>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline" className="gap-1.5 px-3 py-1">
                                            <Workflow className="h-3.5 w-3.5" />
                                            {formatDecisionLabel(data.decision)}
                                        </Badge>
                                        <Badge variant="outline" className="gap-1.5 px-3 py-1">
                                            <MessageSquare className="h-3.5 w-3.5" />
                                            {String(data.comment ?? '').trim() ? 'Comment added' : 'Comment missing'}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="grid gap-4 p-5 md:grid-cols-3">
                                <DecisionOptionCard
                                    active={data.decision === 'approve'}
                                    title="Approve"
                                    description="Confirm the appraisal and move it forward."
                                    icon={CheckCircle2}
                                    onClick={() => setData('decision', 'approve')}
                                />
                                <DecisionOptionCard
                                    active={data.decision === 'send_back'}
                                    title="Send Back"
                                    description="Return it for updates at an earlier stage."
                                    icon={CornerUpLeft}
                                    onClick={() => setData('decision', 'send_back')}
                                />
                                <DecisionOptionCard
                                    active={data.decision === 'reject'}
                                    title="Reject"
                                    description="Reject the current submission and record the reason."
                                    icon={ShieldX}
                                    onClick={() => setData('decision', 'reject')}
                                />
                            </CardContent>
                        </div>
                    </Card>

                    <Card className="border-0 shadow-md">
                        <CardHeader className="bg-muted/20 border-b">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ClipboardCheck className="h-4.5 w-4.5" />
                                Decision Details
                            </CardTitle>
                            <CardDescription>Add the approval note and, when returning or rejecting, choose the stage to reopen.</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-5 p-5">
                            {data.decision !== 'approve' ? (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Return to stage</label>
                                    <Select value={data.reopened_stage} onValueChange={(value: ReopenedStage) => setData('reopened_stage', value)}>
                                        <SelectTrigger className="w-full md:w-80">
                                            <SelectValue placeholder="Select stage" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="manager_review">Manager review</SelectItem>
                                            <SelectItem value="self_assessment">Self assessment</SelectItem>
                                            <SelectItem value="goal_setting">Goal setting</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-muted-foreground text-xs">Current selection: {formatStageLabel(data.reopened_stage)}</p>
                                </div>
                            ) : null}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Approver comment</label>
                                <textarea
                                    className="bg-background min-h-32 w-full rounded-md border px-3 py-2"
                                    placeholder={`Enter your ${formatDecisionLabel(data.decision).toLowerCase()} note here...`}
                                    value={data.comment}
                                    onChange={(event) => setData('comment', event.target.value)}
                                />
                                <p className="text-muted-foreground text-xs">
                                    This note explains the decision and becomes part of the appraisal record.
                                </p>
                            </div>

                            <AppraisalStepSubmitActions
                                stepKey="approval"
                                appraisal={appraisal}
                                abilities={abilities}
                                hasGoals={hasGoals}
                                canOpenDevelopmentPlan={canOpenDevelopmentPlan}
                            >
                                <div className="flex flex-wrap gap-2">
                                    <Button type="button" onClick={handleSubmitDecision} disabled={processing} aria-busy={processing}>
                                        {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                        {processing ? 'Submitting…' : 'Submit Decision'}
                                    </Button>
                                </div>
                            </AppraisalStepSubmitActions>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md">
                        <CardHeader className="bg-muted/20 border-b">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-2">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Workflow className="h-4.5 w-4.5" />
                                        Approval & Audit Trail
                                    </CardTitle>
                                    <CardDescription>
                                        Review prior approval actions and status transitions before you submit your decision.
                                    </CardDescription>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="gap-1.5 px-3 py-1">
                                        <BadgeCheck className="h-3.5 w-3.5" />
                                        {(appraisal.approvals ?? []).length} approval{(appraisal.approvals ?? []).length === 1 ? '' : 's'}
                                    </Badge>
                                    <Badge variant="outline" className="gap-1.5 px-3 py-1">
                                        <History className="h-3.5 w-3.5" />
                                        {(appraisal.status_histories ?? []).length} status change
                                        {(appraisal.status_histories ?? []).length === 1 ? '' : 's'}
                                    </Badge>
                                    <Badge variant="outline" className="gap-1.5 px-3 py-1">
                                        <ClipboardCheck className="h-3.5 w-3.5" />
                                        Audit record
                                    </Badge>
                                </div>
                            </div>
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

            <AlertDialog
                open={actionModalOpen}
                onOpenChange={(open) => {
                    if (!processing) {
                        setActionModalOpen(open);
                    }
                }}
            >
                <AlertDialogContent className="max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            {processing ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <actionModal.icon className="h-5 w-5 text-primary" />}
                            {actionModal.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 text-left text-sm leading-6 text-muted-foreground">
                                <p className="text-foreground">{actionModal.lead}</p>
                                <ul className="list-disc space-y-1.5 pl-5">
                                    {actionModal.steps.map((step) => (
                                        <li key={step}>{step}</li>
                                    ))}
                                </ul>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={submitAlertOpen} onOpenChange={setSubmitAlertOpen}>
                <AlertDialogContent className="max-w-3xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                            Approval submission is incomplete
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-xl bg-white p-2 shadow-sm">
                                            <BadgeCheck className="h-4 w-4 text-amber-700" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-amber-900">
                                                Please complete the missing decision details before submitting.
                                            </p>
                                            <p className="text-sm text-amber-800">
                                                The items below show exactly what is missing from the approval input.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="gap-1.5 px-3 py-1">
                                        <Workflow className="h-3.5 w-3.5" />
                                        Decision: {formatDecisionLabel(data.decision)}
                                    </Badge>
                                    {data.decision !== 'approve' ? (
                                        <Badge variant="outline" className="gap-1.5 px-3 py-1">
                                            <Undo2 className="h-3.5 w-3.5" />
                                            Stage: {formatStageLabel(data.reopened_stage)}
                                        </Badge>
                                    ) : null}
                                    <Badge variant="outline" className="gap-1.5 px-3 py-1">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        {validationIssues.length} validation issue{validationIssues.length === 1 ? '' : 's'}
                                    </Badge>
                                </div>

                                <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
                                    {validationIssues.map((issue) => (
                                        <ValidationIssueCard key={issue.key} issue={issue} />
                                    ))}
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Back to approval</AlertDialogCancel>
                        <AlertDialogAction onClick={() => setSubmitAlertOpen(false)}>Continue editing</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PerformancePage>
    );
}

function DecisionOptionCard({
    active,
    title,
    description,
    icon: Icon,
    onClick,
}: {
    active: boolean;
    title: string;
    description: string;
    icon: typeof CheckCircle2;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-2xl border p-4 text-left transition-all ${
                active ? 'border-primary bg-background ring-primary/20 shadow-sm ring-1' : 'bg-background/80 hover:bg-background'
            }`}
        >
            <div className="flex items-start gap-3">
                <div className={`rounded-xl p-2 ${active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <p className="text-foreground font-medium">{title}</p>
                        {active ? <Badge className="px-2 py-0.5">Selected</Badge> : null}
                    </div>
                    <p className="text-muted-foreground text-sm leading-6">{description}</p>
                </div>
            </div>
        </button>
    );
}

function ValidationIssueCard({ issue }: { issue: ValidationIssue }) {
    return (
        <div className="bg-background rounded-2xl border p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
                    <AlertTriangle className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-foreground font-medium">{issue.title}</p>
                    <p className="text-muted-foreground text-sm leading-6">{issue.description}</p>
                    {issue.currentValue ? (
                        <div className="bg-muted/20 rounded-xl border px-3 py-2">
                            <div className="text-muted-foreground mb-1 flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                                <MessageSquare className="h-3.5 w-3.5" />
                                Current value
                            </div>
                            <p className="text-foreground text-sm">{issue.currentValue}</p>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function formatDecisionLabel(decision: ApprovalDecision) {
    switch (decision) {
        case 'approve':
            return 'Approve';
        case 'send_back':
            return 'Send Back';
        case 'reject':
            return 'Reject';
        default:
            return 'Decision';
    }
}

function formatStageLabel(stage: string | null | undefined) {
    switch (stage) {
        case 'manager_review':
            return 'Manager review';
        case 'self_assessment':
            return 'Self assessment';
        case 'goal_setting':
            return 'Goal setting';
        default:
            return 'Not selected';
    }
}

function getDecisionMeta(decision: ApprovalDecision) {
    switch (decision) {
        case 'approve':
            return {
                icon: CheckCircle2,
            };
        case 'send_back':
            return {
                icon: CornerUpLeft,
            };
        case 'reject':
            return {
                icon: ShieldX,
            };
        default:
            return {
                icon: BadgeCheck,
            };
    }
}

function getActionModalContent(decision: ApprovalDecision, reopenedStage: ReopenedStage) {
    const stageLabel = formatStageLabel(reopenedStage);

    if (decision === 'approve') {
        return {
            icon: CheckCircle2,
            title: 'Approving appraisal',
            lead: 'Your approval is being saved and the appraisal will move forward to calibration.',
            steps: [
                'Scores and ratings are confirmed on the record.',
                'The workflow status updates to calibration pending.',
                'You will be taken to the next step automatically.',
            ],
        };
    }

    if (decision === 'reject') {
        return {
            icon: ShieldX,
            title: 'Rejecting and returning appraisal',
            lead: `The appraisal is being rejected and reopened at ${stageLabel}.`,
            steps: [
                'Your rejection note is stored in the audit trail.',
                `The record is marked sent back to ${stageLabel}.`,
                'The responsible parties can update and resubmit from that step.',
                'You will be redirected to the reopened step shortly.',
            ],
        };
    }

    return {
        icon: CornerUpLeft,
        title: 'Sending appraisal back',
        lead: `The appraisal is being returned to ${stageLabel} for updates.`,
        steps: [
            'Your send-back comment is saved in the audit trail.',
            `Workflow reopens at ${stageLabel} so the right people can edit.`,
            'Earlier completed steps stay on record until resubmitted.',
            'You will be redirected to the reopened step shortly.',
        ],
    };
}
