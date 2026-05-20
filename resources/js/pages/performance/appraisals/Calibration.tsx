import AppraisalWorkflowJourneyCard from '@/components/performance/AppraisalWorkflowJourneyCard';
import AppraisalWorkspaceChrome from '@/components/performance/AppraisalWorkspaceChrome';
import ApprovalTimeline from '@/components/performance/ApprovalTimeline';
import CalibrationEvidenceDropzone from '@/components/performance/CalibrationEvidenceDropzone';
import PerformancePage from '@/components/performance/PerformancePage';
import ScoreSummaryCard from '@/components/performance/ScoreSummaryCard';
import { resolveOverallRatingLevelId, type OverallRatingOption } from '@/lib/performance/rating-scale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal } from '@/types/performance';
import { router, useForm } from '@inertiajs/react';
import {
    ArrowLeftRight,
    BadgeCheck,
    ClipboardPen,
    CornerUpLeft,
    FileSearch,
    Loader2,
    Send,
    ShieldCheck,
    Sparkles,
    Trophy,
    Workflow,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
    appraisal: Appraisal;
    abilities: Record<string, boolean>;
    overallRatingOptions: OverallRatingOption[];
}

type CalibrationDecision = 'confirmed' | 'adjusted' | 'send_back';

type CalibrationForm = {
    decision: CalibrationDecision;
    calibrated_overall_score: string;
    calibrated_overall_rating_scale_level_id: string;
    comment: string;
    evidence_summary: string;
};

const breadcrumbs = (appraisal: Appraisal): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Appraisals', href: route('performance.appraisals.index') },
    { title: appraisal.employee_name_snapshot, href: route('performance.appraisals.show', appraisal.id) },
    { title: 'Calibration', href: route('performance.appraisals.calibration', appraisal.id) },
];

export default function Calibration({ appraisal, abilities, overallRatingOptions }: Props) {
    const [draftSaved, setDraftSaved] = useState(false);
    const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const originalOverallScore = appraisal.overall_score ?? null;
    const originalOverallRating = appraisal.overall_rating_level?.label ?? 'Unrated';

    const { data, setData, processing } = useForm<CalibrationForm>({
        decision: 'confirmed',
        calibrated_overall_score: appraisal.calibrated_overall_score != null ? String(appraisal.calibrated_overall_score) : '',
        calibrated_overall_rating_scale_level_id: appraisal.calibrated_overall_rating_level?.id
            ? String(appraisal.calibrated_overall_rating_level.id)
            : '',
        comment: appraisal.calibration_comment ?? '',
        evidence_summary: appraisal.latest_calibration?.evidence_summary ?? '',
    });

    const applyScoreToRating = (scoreValue: string) => {
        const score = Number(scoreValue);
        if (Number.isNaN(score)) {
            return;
        }

        const levelId = resolveOverallRatingLevelId(overallRatingOptions, score);
        if (levelId) {
            setData('calibrated_overall_rating_scale_level_id', levelId);
        }
    };

    const selectAdjustedDecision = () => {
        const scoreValue =
            data.calibrated_overall_score !== ''
                ? data.calibrated_overall_score
                : originalOverallScore != null
                  ? String(originalOverallScore)
                  : '';

        setData((current) => ({
            ...current,
            decision: 'adjusted',
            calibrated_overall_score: scoreValue,
            calibrated_overall_rating_scale_level_id:
                scoreValue !== ''
                    ? resolveOverallRatingLevelId(overallRatingOptions, Number(scoreValue)) ?? current.calibrated_overall_rating_scale_level_id
                    : current.calibrated_overall_rating_scale_level_id,
        }));
    };

    const hydratedFromStorage = useRef(false);
    const draftStorageKey = useMemo(() => `performance:appraisals:calibration:draft:${appraisal.id}`, [appraisal.id]);
    const initialDraftSnapshot = useMemo(
        () =>
            JSON.stringify({
                decision: 'confirmed',
                calibrated_overall_score: appraisal.calibrated_overall_score != null ? String(appraisal.calibrated_overall_score) : '',
                calibrated_overall_rating_scale_level_id: appraisal.calibrated_overall_rating_level?.id
                    ? String(appraisal.calibrated_overall_rating_level.id)
                    : '',
                comment: appraisal.calibration_comment ?? '',
                evidence_summary: appraisal.latest_calibration?.evidence_summary ?? '',
            }),
        [appraisal.calibrated_overall_rating_level?.id, appraisal.calibrated_overall_score, appraisal.calibration_comment, appraisal.latest_calibration?.evidence_summary],
    );

    useEffect(() => {
        if (typeof window === 'undefined' || hydratedFromStorage.current) return;

        const raw = window.localStorage.getItem(draftStorageKey);
        if (!raw) {
            hydratedFromStorage.current = true;
            return;
        }

        try {
            const parsed = JSON.parse(raw) as Partial<CalibrationForm>;
            (Object.keys(parsed) as Array<keyof CalibrationForm>).forEach((key) => {
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

    useEffect(() => {
        if (data.decision !== 'adjusted' || data.calibrated_overall_score === '') {
            return;
        }

        applyScoreToRating(data.calibrated_overall_score);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-map when score or scale options change
    }, [data.calibrated_overall_score, data.decision, overallRatingOptions]);

    const submitCalibration = () => {
        setSubmitting(true);

        router.post(
            route('performance.appraisals.calibration.store', appraisal.id),
            {
                ...data,
                evidence_files: evidenceFiles,
            },
            {
                forceFormData: true,
                onSuccess: () => {
                    if (typeof window !== 'undefined') {
                        window.localStorage.removeItem(draftStorageKey);
                    }
                    setDraftSaved(false);
                    setEvidenceFiles([]);
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const showAdjustedFields = data.decision === 'adjusted';
    const isSubmitting = processing || submitting;
    const effectiveScore = showAdjustedFields && data.calibrated_overall_score ? Number(data.calibrated_overall_score) : originalOverallScore;
    const effectiveRating =
        showAdjustedFields && data.calibrated_overall_rating_scale_level_id
            ? overallRatingOptions.find((option) => String(option.value) === data.calibrated_overall_rating_scale_level_id)?.label ?? null
            : originalOverallRating;

    return (
        <PerformancePage
            title="Calibration"
            description="Confirm or adjust the final outcome before HR/Admin finalization."
            breadcrumbs={breadcrumbs(appraisal)}
        >
            <AppraisalWorkspaceChrome
                appraisal={appraisal}
                title="Calibration"
                description="Use this workspace to validate the approved outcome, document any committee override, and send the appraisal forward to finalization."
                badgeLabel="Calibration Committee Workspace"
                badgeIcon={ShieldCheck}
                canEditGoals={abilities.plan}
                draftTag={draftSaved ? 'Saved as draft' : null}
            />

            <div className="grid gap-6 xl:grid-cols-12">
                <div className="space-y-6 xl:col-span-8">
                    <Card className="overflow-hidden border-0 shadow-md">
                        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background">
                            <CardHeader className="border-b bg-transparent">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="space-y-3">
                                        <Badge variant="secondary" className="w-fit gap-1.5 px-3 py-1">
                                            <Sparkles className="h-3.5 w-3.5" />
                                            Committee review panel
                                        </Badge>
                                        <div className="space-y-1.5">
                                            <CardTitle className="flex items-center gap-2 text-xl">
                                                <FileSearch className="h-5 w-5" />
                                                Calibration Decision
                                            </CardTitle>
                                            <CardDescription className="max-w-2xl text-sm leading-6">
                                                Confirm the approved rating, adjust the final outcome with evidence, or send the appraisal back to approval.
                                            </CardDescription>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline" className="gap-1.5 px-3 py-1">
                                            <Trophy className="h-3.5 w-3.5" />
                                            Approved rating: {originalOverallRating}
                                        </Badge>
                                        <Badge variant="outline" className="gap-1.5 px-3 py-1">
                                            <Workflow className="h-3.5 w-3.5" />
                                            {formatDecisionLabel(data.decision)}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="grid gap-4 p-5 md:grid-cols-3">
                                <DecisionCard
                                    active={data.decision === 'confirmed'}
                                    title="Confirm Rating"
                                    description="Keep the approved score and rating exactly as reviewed by the approver."
                                    icon={BadgeCheck}
                                    onClick={() => setData('decision', 'confirmed')}
                                />
                                <DecisionCard
                                    active={data.decision === 'adjusted'}
                                    title="Adjust Rating"
                                    description="Override the final overall score and rating with a reason and evidence."
                                    icon={ArrowLeftRight}
                                    onClick={selectAdjustedDecision}
                                />
                                <DecisionCard
                                    active={data.decision === 'send_back'}
                                    title="Send Back"
                                    description="Return the appraisal to approval if the approved outcome should be revisited."
                                    icon={CornerUpLeft}
                                    onClick={() => setData('decision', 'send_back')}
                                />
                            </CardContent>
                        </div>
                    </Card>

                    <Card className="border-0 shadow-md">
                        <CardHeader className="border-b bg-muted/20">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ClipboardPen className="h-4.5 w-4.5" />
                                Calibration Input
                            </CardTitle>
                            <CardDescription>
                                Comments are required for every committee decision. Evidence is required when the outcome changes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5 p-5">
                            {showAdjustedFields ? (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Adjusted overall score</label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={data.calibrated_overall_score}
                                            onChange={(event) => {
                                                const value = event.target.value;
                                                setData('calibrated_overall_score', value);
                                                applyScoreToRating(value);
                                            }}
                                            placeholder="Enter adjusted score"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Adjusted final rating</label>
                                        <Select
                                            value={data.calibrated_overall_rating_scale_level_id}
                                            onValueChange={(value) => setData('calibrated_overall_rating_scale_level_id', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select rating" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {overallRatingOptions.map((option) => (
                                                    <SelectItem key={option.value} value={String(option.value)}>
                                                        {option.label}
                                                        {option.min_percent != null && option.max_percent != null
                                                            ? ` (${option.min_percent}–${option.max_percent}%)`
                                                            : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Selected automatically from the overall rating scale based on the adjusted score.
                                        </p>
                                    </div>
                                </div>
                            ) : null}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Committee comment</label>
                                <textarea
                                    className="min-h-32 w-full rounded-md border bg-background px-3 py-2"
                                    placeholder="Explain the calibration decision clearly."
                                    value={data.comment}
                                    onChange={(event) => setData('comment', event.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Evidence / reference summary</label>
                                <textarea
                                    className="min-h-24 w-full rounded-md border bg-background px-3 py-2"
                                    placeholder="Reference committee notes, benchmark data, moderation evidence, or supporting material."
                                    value={data.evidence_summary}
                                    onChange={(event) => setData('evidence_summary', event.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Required when adjusting the outcome unless you upload supporting files.
                                </p>
                            </div>

                            {showAdjustedFields ? (
                                <CalibrationEvidenceDropzone
                                    files={evidenceFiles}
                                    onChange={setEvidenceFiles}
                                    disabled={isSubmitting}
                                />
                            ) : null}

                            <div className="flex flex-wrap gap-2">
                                <Button type="button" onClick={submitCalibration} disabled={isSubmitting} aria-busy={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    {isSubmitting ? 'Submitting…' : 'Submit Calibration'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md">
                        <CardHeader className="border-b bg-muted/20">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Workflow className="h-4.5 w-4.5" />
                                Approval & Audit Trail
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <ApprovalTimeline approvals={appraisal.approvals ?? []} histories={appraisal.status_histories ?? []} />
                        </CardContent>
                    </Card>
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
                        <CardHeader className="border-b bg-muted/20 pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Trophy className="h-4.5 w-4.5" />
                                Score Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <ScoreSummaryCard
                                businessScore={appraisal.business_score}
                                valuesScore={appraisal.values_score}
                                overallScore={effectiveScore}
                                overallRating={effectiveRating}
                                layout="row"
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PerformancePage>
    );
}

function DecisionCard({
    active,
    title,
    description,
    icon: Icon,
    onClick,
}: {
    active: boolean;
    title: string;
    description: string;
    icon: typeof BadgeCheck;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`cursor-pointer rounded-2xl border p-4 text-left transition-all ${
                active ? 'border-primary bg-background shadow-sm ring-1 ring-primary/20' : 'bg-background/80 hover:bg-background'
            }`}
        >
            <div className="flex items-start gap-3">
                <div className={`rounded-xl p-2 ${active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{title}</p>
                        {active ? <Badge className="px-2 py-0.5">Selected</Badge> : null}
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
            </div>
        </button>
    );
}

function formatDecisionLabel(decision: CalibrationDecision) {
    switch (decision) {
        case 'confirmed':
            return 'Confirm Rating';
        case 'adjusted':
            return 'Adjust Rating';
        case 'send_back':
            return 'Send Back';
        default:
            return 'Calibration';
    }
}
