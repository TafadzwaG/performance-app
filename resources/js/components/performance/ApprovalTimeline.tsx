import HeadingSmall from '@/components/heading-small';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { AppraisalApproval, AppraisalStatusHistory } from '@/types/performance';

interface ApprovalTimelineProps {
    approvals: AppraisalApproval[];
    histories: AppraisalStatusHistory[];
}

export default function ApprovalTimeline({ approvals, histories }: ApprovalTimelineProps) {
    return (
        <Card>
            <CardHeader>
                <HeadingSmall title="Workflow Timeline" description="Approval actions and status changes." />
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                    <div className="text-sm font-medium">Approvals</div>
                    {approvals.map((approval) => (
                        <div key={approval.id} className="rounded-lg border p-3 text-sm">
                            <div className="font-medium">
                                {approval.actor?.name ?? 'System'} · {approval.action}
                            </div>
                            <div className="text-muted-foreground">{approval.stage}</div>
                            {approval.comments ? <div className="mt-2 whitespace-pre-wrap">{approval.comments}</div> : null}
                        </div>
                    ))}
                </div>
                <div className="space-y-3">
                    <div className="text-sm font-medium">Status History</div>
                    {histories.map((history) => (
                        <div key={history.id} className="rounded-lg border p-3 text-sm">
                            <div className="font-medium">
                                {history.from_status ?? 'start'} → {history.to_status}
                            </div>
                            <div className="text-muted-foreground">{history.actor?.name ?? 'System'}</div>
                            {history.reason ? <div className="mt-2 whitespace-pre-wrap">{history.reason}</div> : null}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
