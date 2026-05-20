import HeadingSmall from '@/components/heading-small';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { AppraisalApproval, AppraisalStatusHistory } from '@/types/performance';

interface ApprovalTimelineProps {
    approvals: AppraisalApproval[];
    histories: AppraisalStatusHistory[];
}

function unwrap(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object' && value !== null && 'value' in value) {
        return String((value as { value: unknown }).value ?? '');
    }
    return String(value);
}

export default function ApprovalTimeline({ approvals, histories }: ApprovalTimelineProps) {
    return (
        <Card className="shadow-sm">
            <CardHeader>
                <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                    § Workflow Timeline
                </div>
                <HeadingSmall title="Approvals & history" description="Approval actions and status changes." />
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                    <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                        Approvals
                    </div>
                    {approvals.map((approval) => (
                        <div key={approval.id} className="rounded-lg border bg-muted/15 p-4">
                            <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                {unwrap(approval.stage).replace(/_/g, ' ')}
                            </div>
                            <div className="font-display text-foreground mt-1 text-base leading-tight font-light">
                                {approval.actor?.name ?? 'System'}
                                <span className="text-foreground/55 ml-1.5 text-[12px]">
                                    · {unwrap(approval.action).replace(/_/g, ' ')}
                                </span>
                            </div>
                            {approval.comments ? (
                                <div className="text-foreground/75 mt-2 text-[13px] leading-relaxed whitespace-pre-wrap">
                                    {approval.comments}
                                </div>
                            ) : null}
                        </div>
                    ))}
                    {approvals.length === 0 ? (
                        <div className="text-muted-foreground text-[13px]">No approval actions captured yet.</div>
                    ) : null}
                </div>
                <div className="space-y-3">
                    <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                        Status History
                    </div>
                    {histories.map((history) => (
                        <div key={history.id} className="rounded-lg border bg-muted/15 p-4">
                            <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                {(unwrap(history.from_status) || 'start').replace(/_/g, ' ')} →{' '}
                                {unwrap(history.to_status).replace(/_/g, ' ')}
                            </div>
                            <div className="font-display text-foreground mt-1 text-base leading-tight font-light">
                                {history.actor?.name ?? 'System'}
                            </div>
                            {history.reason ? (
                                <div className="text-foreground/75 mt-2 text-[13px] leading-relaxed whitespace-pre-wrap">
                                    {history.reason}
                                </div>
                            ) : null}
                        </div>
                    ))}
                    {histories.length === 0 ? (
                        <div className="text-muted-foreground text-[13px]">No status transitions recorded yet.</div>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}
