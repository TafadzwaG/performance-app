import AppraisalWorkspaceChrome from '@/components/performance/AppraisalWorkspaceChrome';
import AppraisalWorkflowJourneyCard from '@/components/performance/AppraisalWorkflowJourneyCard';
import CompetencyRatingTable from '@/components/performance/CompetencyRatingTable';
import ObjectiveTable from '@/components/performance/ObjectiveTable';
import PerformancePage from '@/components/performance/PerformancePage';
import ScoreSummaryCard from '@/components/performance/ScoreSummaryCard';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal, CompetencyRating, Objective, Option } from '@/types/performance';
import { router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Calculator,
    CheckCircle2,
    ClipboardCheck,
    CornerUpLeft,
    Loader2,
    MessageSquare,
    Save,
    Send,
    ShieldCheck,
    Star,
    Target,
    Trophy,
    User,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
    appraisal: Appraisal;
    abilities: Record<string, boolean>;
}

type ManagerReviewForm = {
    objectives: Array<{
        id: number;
        manager_rating_scale_level_id: string | number;
        manager_comment: string;
    }>;
    competency_ratings: Array<{
        id: number;
        manager_rating_scale_level_id: string | number;
        manager_comment: string;
    }>;
    comment: string;
};

type ValidationIssue = {
    key: string;
    section: 'overall' | 'objective' | 'competency';
    title: string;
    employeeRating: string | null;
    employeeComment: string | null;
    managerRating: string | null;
    managerComment: string | null;
    missingManagerRating: boolean;
    missingManagerComment: boolean;
    instruction: string;
};

type LooseRecord = Record<string, unknown>;

const breadcrumbs = (appraisal: Appraisal): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Appraisals', href: route('performance.appraisals.index') },
    { title: appraisal.employee_name_snapshot, href: route('performance.appraisals.show', appraisal.id) },
    { title: 'Manager Review', href: route('performance.appraisals.manager_review', appraisal.id) },
];

export default function ManagerReview({ appraisal, abilities }: Props) {
    const [draftSaved, setDraftSaved] = useState(false);
    const [submitAlertOpen, setSubmitAlertOpen] = useState(false);
    const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);

    const appraisalRecord = appraisal as unknown as LooseRecord;
    const objectiveLevels = (appraisal.template?.objective_rating_scale?.levels ?? []) as Array<LooseRecord>;
    const competencyLevels = (appraisal.template?.competency_rating_scale?.levels ?? []) as Array<LooseRecord>;
    const initialOverallManagerComment =
        readText(appraisalRecord, ['manager_comment', 'overall_manager_comment', 'comment_manager']) ?? '';

    const perspectiveOptions: Option[] = (appraisal.objectives ?? []).map((objective) => ({
        value: objective.perspective_id,
        label: objective.perspective?.name ?? `Perspective ${objective.perspective_id}`,
    }));

    const { data, setData, put, post, processing } = useForm<ManagerReviewForm>({
        objectives:
            appraisal.objectives?.map((objective) => ({
                id: objective.id,
                manager_rating_scale_level_id: objective.manager_rating_scale_level_id ?? '',
                manager_comment: objective.manager_comment ?? '',
            })) ?? [],
        competency_ratings:
            appraisal.competency_ratings?.map((rating) => ({
                id: rating.id,
                manager_rating_scale_level_id: rating.manager_rating_scale_level_id ?? '',
                manager_comment: rating.manager_comment ?? '',
            })) ?? [],
        comment: initialOverallManagerComment,
    });

    const hydratedFromStorage = useRef(false);

    const draftStorageKey = useMemo(
        () => `performance:appraisals:manager-review:draft:${appraisal.id}`,
        [appraisal.id],
    );

    const initialDraftSnapshot = useMemo(
        () =>
            JSON.stringify({
                objectives:
                    appraisal.objectives?.map((objective) => ({
                        id: objective.id,
                        manager_rating_scale_level_id: objective.manager_rating_scale_level_id ?? '',
                        manager_comment: objective.manager_comment ?? '',
                    })) ?? [],
                competency_ratings:
                    appraisal.competency_ratings?.map((rating) => ({
                        id: rating.id,
                        manager_rating_scale_level_id: rating.manager_rating_scale_level_id ?? '',
                        manager_comment: rating.manager_comment ?? '',
                    })) ?? [],
                comment: initialOverallManagerComment,
            }),
        [appraisal.competency_ratings, appraisal.objectives, initialOverallManagerComment],
    );

    useEffect(() => {
        if (typeof window === 'undefined' || hydratedFromStorage.current) return;

        const raw = window.localStorage.getItem(draftStorageKey);
        if (!raw) {
            hydratedFromStorage.current = true;
            return;
        }

        try {
            const parsed = JSON.parse(raw) as Partial<ManagerReviewForm>;

            (Object.keys(parsed) as Array<keyof ManagerReviewForm>).forEach((key) => {
                const value = parsed[key];
                if (value !== undefined) {
                    setData(key, value);
                }
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

    const updateObjective = (index: number, field: string, value: string | number | boolean | null) => {
        const next = [...data.objectives];
        next[index] = { ...next[index], [field]: value };
        setData('objectives', next);
    };

    const updateRating = (index: number, field: string, value: string | number | null) => {
        const next = [...data.competency_ratings];
        next[index] = { ...next[index], [field]: value };
        setData('competency_ratings', next);
    };

    const getManagerValidationIssues = (): ValidationIssue[] => {
        const issues: ValidationIssue[] = [];

        const overallEmployeeComment =
            readText(appraisalRecord, [
                'employee_comment',
                'employee_overall_comment',
                'self_comment',
                'self_overall_comment',
            ]) ?? null;

        const overallEmployeeRating =
            firstNonEmpty(
                readText(appraisalRecord, ['employee_overall_rating_label', 'self_overall_rating_label']),
                readText(appraisalRecord, ['employee_rating_label', 'self_rating_label']),
            ) ?? null;

        if (!String(data.comment ?? '').trim()) {
            issues.push({
                key: 'overall-comment',
                section: 'overall',
                title: 'Overall Manager Review',
                employeeRating: overallEmployeeRating,
                employeeComment: overallEmployeeComment,
                managerRating: appraisal.overall_rating_level?.label ?? null,
                managerComment: String(data.comment ?? '').trim() || null,
                missingManagerRating: false,
                missingManagerComment: true,
                instruction: 'Add the overall manager comment before submitting this review.',
            });
        }

        data.objectives.forEach((objective, index) => {
            const sourceObjective = ((appraisal.objectives ?? [])[index] ?? {}) as unknown as LooseRecord;

            const title =
                firstNonEmpty(
                    readText(sourceObjective, ['title', 'name', 'objective_title', 'label']),
                    `Objective ${index + 1}`,
                ) ?? `Objective ${index + 1}`;

            const employeeRatingValue = readValue(sourceObjective, [
                'employee_rating_scale_level_id',
                'self_rating_scale_level_id',
                'employee_rating_level_id',
                'self_rating_level_id',
            ]);

            const employeeRating =
                firstNonEmpty(
                    getRatingLabel(objectiveLevels, employeeRatingValue),
                    readText(sourceObjective, ['employee_rating_label', 'self_rating_label']),
                ) ?? null;

            const employeeComment =
                readText(sourceObjective, ['employee_comment', 'self_comment', 'comment']) ?? null;

            const managerRatingValue = objective.manager_rating_scale_level_id;
            const managerRating =
                getRatingLabel(objectiveLevels, managerRatingValue) ??
                getRatingLabel(objectiveLevels, readValue(sourceObjective, ['manager_rating_scale_level_id'])) ??
                null;

            const managerComment = String(objective.manager_comment ?? '').trim() || null;
            const missingManagerRating = isEmptySelection(managerRatingValue);
            const missingManagerComment = !managerComment;

            if (missingManagerRating || missingManagerComment) {
                issues.push({
                    key: `objective-${objective.id}`,
                    section: 'objective',
                    title,
                    employeeRating,
                    employeeComment,
                    managerRating,
                    managerComment,
                    missingManagerRating,
                    missingManagerComment,
                    instruction: buildInstructionText(missingManagerRating, missingManagerComment),
                });
            }
        });

        data.competency_ratings.forEach((rating, index) => {
            const sourceRating = ((appraisal.competency_ratings ?? [])[index] ?? {}) as unknown as LooseRecord;
            const competencyRecord = readValue(sourceRating, ['competency']) as LooseRecord | null;

            const title =
                firstNonEmpty(
                    competencyRecord ? readText(competencyRecord, ['name', 'label']) : null,
                    readText(sourceRating, ['title', 'name', 'label']),
                    `Value ${index + 1}`,
                ) ?? `Value ${index + 1}`;

            const employeeRatingValue = readValue(sourceRating, [
                'employee_rating_scale_level_id',
                'self_rating_scale_level_id',
                'employee_rating_level_id',
                'self_rating_level_id',
            ]);

            const employeeRating =
                firstNonEmpty(
                    getRatingLabel(competencyLevels, employeeRatingValue),
                    readText(sourceRating, ['employee_rating_label', 'self_rating_label']),
                ) ?? null;

            const employeeComment =
                readText(sourceRating, ['employee_comment', 'self_comment', 'comment']) ?? null;

            const managerRatingValue = rating.manager_rating_scale_level_id;
            const managerRating =
                getRatingLabel(competencyLevels, managerRatingValue) ??
                getRatingLabel(competencyLevels, readValue(sourceRating, ['manager_rating_scale_level_id'])) ??
                null;

            const managerComment = String(rating.manager_comment ?? '').trim() || null;
            const missingManagerRating = isEmptySelection(managerRatingValue);
            const missingManagerComment = !managerComment;

            if (missingManagerRating || missingManagerComment) {
                issues.push({
                    key: `competency-${rating.id}`,
                    section: 'competency',
                    title,
                    employeeRating,
                    employeeComment,
                    managerRating,
                    managerComment,
                    missingManagerRating,
                    missingManagerComment,
                    instruction: buildInstructionText(missingManagerRating, missingManagerComment),
                });
            }
        });

        return issues;
    };

    const handleSubmitForward = () => {
        const issues = getManagerValidationIssues();

        if (issues.length > 0) {
            setValidationIssues(issues);
            setSubmitAlertOpen(true);
            return;
        }

        put(route('performance.appraisals.manager_review.update', appraisal.id), {
            onSuccess: () =>
                post(route('performance.appraisals.manager_review.submit', appraisal.id), {
                    onSuccess: () => {
                        if (typeof window !== 'undefined') {
                            window.localStorage.removeItem(draftStorageKey);
                        }
                        setDraftSaved(false);
                    },
                }),
        });
    };

    return (
        <PerformancePage
            title="Manager Review"
            description="Review self-assessment responses, rate performance, and submit to approval."
            breadcrumbs={breadcrumbs(appraisal)}
        >
            <AppraisalWorkspaceChrome
                appraisal={appraisal}
                title="Manager Review"
                description="Use this workspace to evaluate submitted goals, review evidence, score performance, and move the appraisal forward for approval."
                badgeLabel="Manager Review Workspace"
                badgeIcon={ClipboardCheck}
                canEditGoals={abilities.plan}
                draftTag={draftSaved ? 'Saved as draft' : null}
            />

            <div className="grid gap-6 xl:grid-cols-12">
                <div className="space-y-6 xl:col-span-8">
                    <Card className="border-0 shadow-md">
                        <CardHeader className="border-b bg-muted/20" style={{ margin: '10px' }}>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-4.5 w-4.5" />
                                Objectives
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ObjectiveTable
                                appraisalId={appraisal.id}
                                objectives={(appraisal.objectives ?? []).map((objective, index) => ({
                                    ...objective,
                                    manager_rating_scale_level_id:
                                        Number(
                                            data.objectives[index]?.manager_rating_scale_level_id ??
                                                objective.manager_rating_scale_level_id ??
                                                0,
                                        ) || null,
                                    manager_comment: data.objectives[index]?.manager_comment ?? '',
                                })) as Objective[]}
                                mode="manager"
                                perspectiveOptions={perspectiveOptions}
                                ratingLevels={objectiveLevels}
                                onChange={updateObjective}
                            />
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md">
                        <CardHeader className="border-b bg-muted/20" style={{ margin: '10px' }}>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-4.5 w-4.5" />
                                Values
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CompetencyRatingTable
                                ratings={(appraisal.competency_ratings ?? []).map((rating, index) => ({
                                    ...rating,
                                    manager_rating_scale_level_id:
                                        Number(
                                            data.competency_ratings[index]?.manager_rating_scale_level_id ??
                                                rating.manager_rating_scale_level_id ??
                                                0,
                                        ) || null,
                                    manager_comment: data.competency_ratings[index]?.manager_comment ?? '',
                                })) as CompetencyRating[]}
                                mode="manager"
                                ratingLevels={competencyLevels}
                                onChange={updateRating}
                            />
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md">
                        <CardHeader className="border-b bg-muted/20" style={{ margin: '10px' }}>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-4.5 w-4.5" />
                                Overall Manager Comment
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <textarea
                                className="min-h-32 w-full rounded-md border bg-background px-3 py-2"
                                value={data.comment}
                                onChange={(event) => setData('comment', event.target.value)}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex flex-wrap gap-2">
                        {abilities.managerReview ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    router.post(
                                        route('performance.appraisals.manager_review.recalculate_score', appraisal.id),
                                    )
                                }
                                disabled={processing}
                                aria-busy={processing}
                            >
                                {processing ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Calculator className="mr-2 h-4 w-4" />
                                )}
                                Re-Calculate Score
                            </Button>
                        ) : null}

                        <Button
                            type="button"
                            onClick={() =>
                                put(route('performance.appraisals.manager_review.update', appraisal.id), {
                                    onSuccess: () => setDraftSaved(true),
                                })
                            }
                            disabled={processing}
                            aria-busy={processing}
                        >
                            {processing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            {processing ? 'Saving…' : 'Save Review'}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleSubmitForward}
                            disabled={processing}
                            aria-busy={processing}
                        >
                            {processing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="mr-2 h-4 w-4" />
                            )}
                            {processing ? 'Submitting…' : 'Submit Forward'}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                router.post(route('performance.appraisals.manager_review.send_back', appraisal.id), {
                                    reason: 'Returned to employee for updates.',
                                    reopened_stage: 'self_assessment',
                                })
                            }
                            disabled={processing}
                            aria-busy={processing}
                        >
                            <CornerUpLeft className="mr-2 h-4 w-4" />
                            Send Back
                        </Button>
                    </div>
                </div>

                <div className="space-y-6 xl:col-span-4">
                    <AppraisalWorkflowJourneyCard
                        appraisalId={appraisal.id}
                        status={appraisal.status}
                        reopenedStage={appraisal.reopened_stage}
                        stageAccess={{
                            goal_setting: abilities.plan,
                            self_assessment_pending: abilities.selfAssess,
                            manager_review_pending: abilities.managerReview,
                            approval_pending: abilities.approve,
                            calibration_pending: abilities.calibrate,
                            finalized: abilities.finalize,
                        }}
                    />

                    <Card className="border-0 shadow-md">
                        <CardHeader className="border-b bg-muted/20 pb-3" style={{ margin: '10px' }}>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Trophy className="h-4.5 w-4.5" />
                                Score Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScoreSummaryCard
                                businessScore={appraisal.business_score}
                                valuesScore={appraisal.values_score}
                                overallScore={appraisal.calibrated_overall_score ?? appraisal.overall_score}
                                overallRating={appraisal.calibrated_overall_rating_level?.label ?? appraisal.overall_rating_level?.label ?? null}
                                layout="row"
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AlertDialog open={submitAlertOpen} onOpenChange={setSubmitAlertOpen}>
                <AlertDialogContent className="max-w-4xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-left">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                            Manager review is incomplete
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-4 text-left">
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 rounded-full bg-white p-2 shadow-sm">
                                            <ClipboardCheck className="h-4 w-4 text-amber-700" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-amber-900">
                                                Please complete the missing manager review details before submitting.
                                            </p>
                                            <p className="text-sm text-amber-800">
                                                The cards below show what the employee submitted and what the manager
                                                still needs to add for each section.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="gap-1.5 px-3 py-1">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        {validationIssues.length} item{validationIssues.length === 1 ? '' : 's'} need attention
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className="gap-1.5 border-amber-200 bg-amber-50 px-3 py-1 text-amber-700"
                                    >
                                        <Star className="h-3.5 w-3.5" />
                                        Missing manager rating
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className="gap-1.5 border-rose-200 bg-rose-50 px-3 py-1 text-rose-700"
                                    >
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        Missing manager comment
                                    </Badge>
                                </div>

                                <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                                    {validationIssues.map((issue) => (
                                        <ValidationIssueCard key={issue.key} issue={issue} />
                                    ))}
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Back to review</AlertDialogCancel>
                        <AlertDialogAction onClick={() => setSubmitAlertOpen(false)}>
                            Continue editing
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PerformancePage>
    );
}

function ValidationIssueCard({ issue }: { issue: ValidationIssue }) {
    const meta = getIssueMeta(issue.section);
    const SectionIcon = meta.icon;

    return (
        <div className="rounded-2xl border bg-background p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <div className={`rounded-2xl p-2 ${meta.iconContainerClass}`}>
                    <SectionIcon className={`h-5 w-5 ${meta.iconClass}`} />
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{issue.title}</p>
                        <Badge variant="secondary" className="px-2 py-0.5">
                            {meta.label}
                        </Badge>

                        {issue.missingManagerRating ? (
                            <Badge
                                variant="outline"
                                className="border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700"
                            >
                                Manager rating missing
                            </Badge>
                        ) : (
                            <Badge
                                variant="outline"
                                className="border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700"
                            >
                                Manager rating added
                            </Badge>
                        )}

                        {issue.missingManagerComment ? (
                            <Badge variant="outline" className="border-rose-200 bg-rose-50 px-2 py-0.5 text-rose-700">
                                Manager comment missing
                            </Badge>
                        ) : (
                            <Badge
                                variant="outline"
                                className="border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700"
                            >
                                Manager comment added
                            </Badge>
                        )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <InfoPanel
                            title="Employee submission"
                            icon={User}
                            rows={[
                                {
                                    icon: Star,
                                    label: 'Employee rating',
                                    value: toDisplayValue(issue.employeeRating, 'No employee rating provided'),
                                },
                                {
                                    icon: MessageSquare,
                                    label: 'Employee comment',
                                    value: toDisplayValue(issue.employeeComment, 'No employee comment provided'),
                                },
                            ]}
                        />

                        <InfoPanel
                            title="Manager input required"
                            icon={ShieldCheck}
                            rows={[
                                {
                                    icon: Star,
                                    label: 'Manager rating',
                                    value: toDisplayValue(
                                        issue.managerRating,
                                        issue.missingManagerRating ? 'Manager rating still missing' : 'Not set',
                                    ),
                                    emphasize: issue.missingManagerRating,
                                },
                                {
                                    icon: MessageSquare,
                                    label: 'Manager comment',
                                    value: toDisplayValue(
                                        issue.managerComment,
                                        issue.missingManagerComment ? 'Manager comment still missing' : 'Not set',
                                    ),
                                    emphasize: issue.missingManagerComment,
                                },
                            ]}
                        />
                    </div>

                    <div className="flex items-start gap-2 rounded-xl border border-dashed bg-muted/20 px-3 py-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                        <p className="text-sm text-muted-foreground">{issue.instruction}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoPanel({
    title,
    icon: Icon,
    rows,
}: {
    title: string;
    icon: typeof User;
    rows: Array<{
        icon: typeof Star;
        label: string;
        value: string;
        emphasize?: boolean;
    }>;
}) {
    return (
        <div className="rounded-2xl border bg-muted/20 p-3">
            <div className="mb-3 flex items-center gap-2">
                <div className="rounded-xl bg-background p-2 shadow-sm">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
                <p className="font-medium text-foreground">{title}</p>
            </div>

            <div className="space-y-2">
                {rows.map((row) => {
                    const RowIcon = row.icon;

                    return (
                        <div
                            key={`${title}-${row.label}`}
                            className={`rounded-xl border px-3 py-2 ${
                                row.emphasize ? 'border-amber-200 bg-amber-50' : 'bg-background'
                            }`}
                        >
                            <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                <RowIcon className="h-3.5 w-3.5" />
                                {row.label}
                            </div>
                            <p className={`text-sm ${row.emphasize ? 'font-medium text-amber-900' : 'text-foreground'}`}>
                                {row.value}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function getIssueMeta(section: ValidationIssue['section']) {
    switch (section) {
        case 'overall':
            return {
                label: 'Overall review',
                icon: ClipboardCheck,
                iconClass: 'text-sky-700',
                iconContainerClass: 'bg-sky-100',
            };
        case 'objective':
            return {
                label: 'Objective',
                icon: Target,
                iconClass: 'text-violet-700',
                iconContainerClass: 'bg-violet-100',
            };
        case 'competency':
            return {
                label: 'Value / competency',
                icon: ShieldCheck,
                iconClass: 'text-emerald-700',
                iconContainerClass: 'bg-emerald-100',
            };
        default:
            return {
                label: 'Review item',
                icon: CheckCircle2,
                iconClass: 'text-slate-700',
                iconContainerClass: 'bg-slate-100',
            };
    }
}

function buildInstructionText(missingManagerRating: boolean, missingManagerComment: boolean) {
    if (missingManagerRating && missingManagerComment) {
        return 'Add both the manager rating and the manager comment before submitting.';
    }

    if (missingManagerRating) {
        return 'Add the manager rating before submitting.';
    }

    return 'Add the manager comment before submitting.';
}

function isEmptySelection(value: unknown) {
    if (value === null || value === undefined) return true;
    const normalized = String(value).trim();
    return normalized === '' || normalized === '0';
}

function readValue(record: LooseRecord | null | undefined, keys: string[]) {
    if (!record) return null;

    for (const key of keys) {
        if (record[key] !== undefined && record[key] !== null) {
            return record[key];
        }
    }

    return null;
}

function readText(record: LooseRecord | null | undefined, keys: string[]) {
    const value = readValue(record, keys);

    if (value === null || value === undefined) return null;

    const normalized = String(value).trim();
    return normalized ? normalized : null;
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
    for (const value of values) {
        if (value && value.trim()) return value;
    }

    return null;
}

function getRatingLabel(levels: Array<LooseRecord>, selectedValue: unknown) {
    if (selectedValue === null || selectedValue === undefined) return null;

    const selected = String(selectedValue).trim();
    if (!selected || selected === '0') return null;

    const match = levels.find((level) => String(level.id ?? '').trim() === selected);
    if (!match) return null;

    const label = firstNonEmpty(
        typeof match.label === 'string' ? match.label : null,
        typeof match.name === 'string' ? match.name : null,
    );

    return label ?? null;
}

function toDisplayValue(value: string | null | undefined, fallback = 'Not provided') {
    return value && value.trim() ? value : fallback;
}
