import AppraisalWorkflowJourneyCard from '@/components/performance/AppraisalWorkflowJourneyCard';
import AppraisalWorkspaceChrome from '@/components/performance/AppraisalWorkspaceChrome';
import PerformancePage from '@/components/performance/PerformancePage';
import ScoreSummaryCard from '@/components/performance/ScoreSummaryCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import { FileCheck2, Lock, Trophy } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
    appraisal: Appraisal;
    abilities: Record<string, boolean>;
}

const breadcrumbs = (appraisal: Appraisal): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Appraisals', href: route('performance.appraisals.index') },
    { title: appraisal.employee_name_snapshot, href: route('performance.appraisals.show', appraisal.id) },
    { title: 'Finalize', href: route('performance.appraisals.finalize', appraisal.id) },
];

export default function Finalize({ appraisal, abilities }: Props) {
    const [draftSaved, setDraftSaved] = useState(false);
    const { data, setData, post, processing } = useForm({
        comment: '',
    });
    const hydratedFromStorage = useRef(false);
    const draftStorageKey = useMemo(() => `performance:appraisals:finalize:draft:${appraisal.id}`, [appraisal.id]);
    const initialDraftSnapshot = useMemo(() => JSON.stringify({ comment: '' }), []);
    const effectiveOverallScore = appraisal.calibrated_overall_score ?? appraisal.overall_score;
    const effectiveOverallRating = appraisal.calibrated_overall_rating_level?.label ?? appraisal.overall_rating_level?.label ?? null;

    useEffect(() => {
        if (typeof window === 'undefined' || hydratedFromStorage.current) return;
        const raw = window.localStorage.getItem(draftStorageKey);
        if (!raw) {
            hydratedFromStorage.current = true;
            return;
        }
        try {
            const parsed = JSON.parse(raw) as Partial<typeof data>;
            (Object.keys(parsed) as Array<keyof typeof data>).forEach((key) => {
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

    return (
        <PerformancePage title="Finalize Appraisal" description="Lock the final result and release the final print pack." breadcrumbs={breadcrumbs(appraisal)}>
            <AppraisalWorkspaceChrome
                appraisal={appraisal}
                title="Finalization"
                description="Use this final workspace to lock the calibrated appraisal, confirm the record is complete, and release the final performance outcome."
                badgeLabel="Finalization Workspace"
                badgeIcon={FileCheck2}
                canEditGoals={abilities.plan}
                draftTag={draftSaved ? 'Saved as draft' : null}
            />

            <div className="grid gap-6 xl:grid-cols-12">
                <div className="space-y-6 xl:col-span-8">
                    <Card className="border-0 shadow-md">
                        <CardHeader className="border-b bg-muted/20" style={{
                            margin: '10px'
                        }}>
                            <CardTitle>Finalization Note</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                                Finalization is read-only for scores and ratings. If the outcome needs to change, it must be sent back before finalization.
                            </div>
                            {appraisal.latest_calibration ? (
                                <div className="rounded-2xl border bg-background p-4">
                                    <div className="text-sm font-medium text-foreground">Calibration Summary</div>
                                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                                        <div>
                                            <div className="text-xs uppercase tracking-wide text-muted-foreground">Committee decision</div>
                                            <div className="mt-1 text-sm font-medium text-foreground">
                                                {String(appraisal.latest_calibration.decision ?? '').replace(/_/g, ' ')}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase tracking-wide text-muted-foreground">Reviewed by</div>
                                            <div className="mt-1 text-sm font-medium text-foreground">
                                                {appraisal.calibrated_by?.name ?? appraisal.latest_calibration.actor?.name ?? 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 text-sm text-muted-foreground">
                                        {appraisal.calibration_comment ?? appraisal.latest_calibration.comments}
                                    </div>
                                </div>
                            ) : null}
                            <textarea className="min-h-28 w-full rounded-md border bg-background px-3 py-2" value={data.comment} onChange={(event) => setData('comment', event.target.value)} />
                            <Button
                                type="button"
                                onClick={() =>
                                    post(route('performance.appraisals.finalize.store', appraisal.id), {
                                        onSuccess: () => {
                                            if (typeof window !== 'undefined') {
                                                window.localStorage.removeItem(draftStorageKey);
                                            }
                                            setDraftSaved(false);
                                        },
                                    })
                                }
                                disabled={processing}
                            >
                                <Lock className="mr-2 h-4 w-4" />
                                Finalize Appraisal
                            </Button>
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
                        <CardContent>
                            <ScoreSummaryCard
                                businessScore={appraisal.business_score}
                                valuesScore={appraisal.values_score}
                                overallScore={effectiveOverallScore}
                                overallRating={effectiveOverallRating}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PerformancePage>
    );
}
