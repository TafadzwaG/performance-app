import AppraisalHeader from '@/components/performance/AppraisalHeader';
import ApprovalTimeline from '@/components/performance/ApprovalTimeline';
import PerformancePage from '@/components/performance/PerformancePage';
import ScoreSummaryCard from '@/components/performance/ScoreSummaryCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal } from '@/types/performance';
import { useForm } from '@inertiajs/react';

interface Props {
    appraisal: Appraisal;
}

const breadcrumbs = (appraisal: Appraisal): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Appraisals', href: route('performance.appraisals.index') },
    { title: appraisal.employee_name_snapshot, href: route('performance.appraisals.show', appraisal.id) },
    { title: 'Approval', href: route('performance.appraisals.approval', appraisal.id) },
];

export default function Approval({ appraisal }: Props) {
    const { data, setData, post, processing } = useForm({
        decision: 'approve',
        comment: '',
        reopened_stage: 'manager_review',
    });

    return (
        <PerformancePage title="Approval" description="Approve, reject, or return the appraisal to an earlier stage." breadcrumbs={breadcrumbs(appraisal)}>
            <AppraisalHeader appraisal={appraisal} />
            <ScoreSummaryCard
                businessScore={appraisal.business_score}
                valuesScore={appraisal.values_score}
                overallScore={appraisal.overall_score}
                overallRating={appraisal.overall_rating_level?.label ?? null}
            />
            <Card>
                <CardHeader>
                    <CardTitle>Decision</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Button type="button" variant={data.decision === 'approve' ? 'default' : 'outline'} onClick={() => setData('decision', 'approve')}>
                            Approve
                        </Button>
                        <Button type="button" variant={data.decision === 'send_back' ? 'default' : 'outline'} onClick={() => setData('decision', 'send_back')}>
                            Send Back
                        </Button>
                        <Button type="button" variant={data.decision === 'reject' ? 'default' : 'outline'} onClick={() => setData('decision', 'reject')}>
                            Reject
                        </Button>
                    </div>
                    {data.decision !== 'approve' ? (
                        <select className="rounded-md border bg-background px-3 py-2 text-sm" value={data.reopened_stage} onChange={(event) => setData('reopened_stage', event.target.value)}>
                            <option value="manager_review">Manager review</option>
                            <option value="self_assessment">Self assessment</option>
                            <option value="goal_setting">Goal setting</option>
                        </select>
                    ) : null}
                    <textarea className="min-h-28 w-full rounded-md border bg-background px-3 py-2" value={data.comment} onChange={(event) => setData('comment', event.target.value)} />
                    <Button type="button" onClick={() => post(route('performance.appraisals.approval.store', appraisal.id))} disabled={processing}>
                        Submit Decision
                    </Button>
                </CardContent>
            </Card>
            <ApprovalTimeline approvals={appraisal.approvals ?? []} histories={appraisal.status_histories ?? []} />
        </PerformancePage>
    );
}
