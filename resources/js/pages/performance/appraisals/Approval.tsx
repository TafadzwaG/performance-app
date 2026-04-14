import AppraisalHeader from '@/components/performance/AppraisalHeader';
import AppraisalWorkflowStepper from '@/components/performance/AppraisalWorkflowStepper';
import ApprovalTimeline from '@/components/performance/ApprovalTimeline';
import PerformancePage from '@/components/performance/PerformancePage';
import ScoreSummaryCard from '@/components/performance/ScoreSummaryCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import { CheckCircle2, ClipboardList, CornerUpLeft, ShieldX, Send, Trophy, Workflow } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';

interface Props {
    appraisal: Appraisal;
    abilities: Record<string, boolean>;
}

const breadcrumbs = (appraisal: Appraisal): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Appraisals', href: route('performance.appraisals.index') },
    { title: appraisal.employee_name_snapshot, href: route('performance.appraisals.show', appraisal.id) },
    { title: 'Approval', href: route('performance.appraisals.approval', appraisal.id) },
];

export default function Approval({ appraisal, abilities }: Props) {
    const { data, setData, post, processing } = useForm({
        decision: 'approve',
        comment: '',
        reopened_stage: 'manager_review',
    });
    const hydratedFromStorage = useRef(false);
    const draftStorageKey = useMemo(() => `performance:appraisals:approval:draft:${appraisal.id}`, [appraisal.id]);

    useEffect(() => {
        if (typeof window === 'undefined' || hydratedFromStorage.current) {
            return;
        }

        const raw = window.localStorage.getItem(draftStorageKey);
        if (!raw) {
            hydratedFromStorage.current = true;
            return;
        }

        try {
            const parsed = JSON.parse(raw) as Partial<typeof data>;
            (Object.keys(parsed) as Array<keyof typeof data>).forEach((key) => {
                const value = parsed[key];
                if (value !== undefined) {
                    setData(key, value);
                }
            });
        } catch {
            window.localStorage.removeItem(draftStorageKey);
        } finally {
            hydratedFromStorage.current = true;
        }
    }, [draftStorageKey, setData]);

    useEffect(() => {
        if (typeof window === 'undefined' || !hydratedFromStorage.current) {
            return;
        }

        window.localStorage.setItem(draftStorageKey, JSON.stringify(data));
    }, [data, draftStorageKey]);

    return (
        <PerformancePage title="Approval" description="Approve, reject, or return the appraisal to an earlier stage." breadcrumbs={breadcrumbs(appraisal)}>
            <Card className="border shadow-sm">
                <CardContent className="space-y-4 p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ClipboardList className="h-4 w-4" />
                            Approval Workspace
                        </div>
                        <Badge variant="secondary">Appraisal #{appraisal.id}</Badge>
                    </div>
                    <AppraisalHeader appraisal={appraisal} />
                </CardContent>
            </Card>

            <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Workflow className="h-4.5 w-4.5" />
                        Workflow Stage
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <AppraisalWorkflowStepper
                        status={appraisal.status}
                        appraisalId={appraisal.id}
                        reopenedStage={appraisal.reopened_stage}
                        stageAccess={{
                            goal_setting: abilities.plan,
                            self_assessment_pending: abilities.selfAssess,
                            manager_review_pending: abilities.managerReview,
                            approval_pending: abilities.approve,
                            approved: true,
                            finalized: abilities.finalize,
                        }}
                    />
                </CardContent>
            </Card>

            <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Trophy className="h-4.5 w-4.5" />
                        Score Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ScoreSummaryCard
                        businessScore={appraisal.business_score}
                        valuesScore={appraisal.values_score}
                        overallScore={appraisal.overall_score}
                        overallRating={appraisal.overall_rating_level?.label ?? null}
                    />
                </CardContent>
            </Card>

            <Card className="border shadow-sm">
                <CardHeader>
                    <CardTitle>Decision</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant={data.decision === 'approve' ? 'default' : 'outline'} onClick={() => setData('decision', 'approve')}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Approve
                        </Button>
                        <Button type="button" variant={data.decision === 'send_back' ? 'default' : 'outline'} onClick={() => setData('decision', 'send_back')}>
                            <CornerUpLeft className="mr-2 h-4 w-4" />
                            Send Back
                        </Button>
                        <Button type="button" variant={data.decision === 'reject' ? 'default' : 'outline'} onClick={() => setData('decision', 'reject')}>
                            <ShieldX className="mr-2 h-4 w-4" />
                            Reject
                        </Button>
                    </div>

                    {data.decision !== 'approve' ? (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Return to stage</label>
                            <Select value={data.reopened_stage} onValueChange={(value) => setData('reopened_stage', value)}>
                                <SelectTrigger className="w-full md:w-72">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manager_review">Manager review</SelectItem>
                                    <SelectItem value="self_assessment">Self assessment</SelectItem>
                                    <SelectItem value="goal_setting">Goal setting</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    ) : null}

                    <textarea className="min-h-28 w-full rounded-md border bg-background px-3 py-2" value={data.comment} onChange={(event) => setData('comment', event.target.value)} />
                    <Button
                        type="button"
                        onClick={() =>
                            post(route('performance.appraisals.approval.store', appraisal.id), {
                                onSuccess: () => {
                                    if (typeof window !== 'undefined') {
                                        window.localStorage.removeItem(draftStorageKey);
                                    }
                                },
                            })
                        }
                        disabled={processing}
                    >
                        <Send className="mr-2 h-4 w-4" />
                        Submit Decision
                    </Button>
                </CardContent>
            </Card>

            <Card className="border shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Workflow className="h-4.5 w-4.5" />
                        Approval & Audit Trail
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ApprovalTimeline approvals={appraisal.approvals ?? []} histories={appraisal.status_histories ?? []} />
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
