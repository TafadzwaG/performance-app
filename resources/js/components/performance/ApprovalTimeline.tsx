import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { AppraisalApproval, AppraisalStatusHistory } from '@/types/performance';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowRight,
    BadgeCheck,
    CheckCircle2,
    CircleDot,
    ClipboardList,
    CornerUpLeft,
    History,
    Inbox,
    MessageSquare,
    Send,
    ShieldX,
    Sparkles,
    User,
} from 'lucide-react';

interface ApprovalTimelineProps {
    approvals: AppraisalApproval[];
    histories: AppraisalStatusHistory[];
    /** When true, omit the outer card wrapper (for use inside a parent card). */
    embedded?: boolean;
}

function unwrap(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object' && value !== null && 'value' in value) {
        return String((value as { value: unknown }).value ?? '');
    }
    return String(value);
}

function getActionIcon(action: string): LucideIcon {
    const normalized = action.toLowerCase().replace(/\s+/g, '_');

    if (normalized.includes('reject')) {
        return ShieldX;
    }
    if (normalized.includes('sent_back') || normalized.includes('back')) {
        return CornerUpLeft;
    }
    if (normalized.includes('forward')) {
        return Send;
    }
    if (normalized.includes('approv') || normalized.includes('submit') || normalized.includes('finaliz') || normalized.includes('calibrat')) {
        return CheckCircle2;
    }

    return CircleDot;
}

function getStageIcon(stage: string): LucideIcon {
    const normalized = stage.toLowerCase().replace(/\s+/g, '_');

    if (normalized.includes('goal')) {
        return ClipboardList;
    }
    if (normalized.includes('self')) {
        return User;
    }
    if (normalized.includes('manager')) {
        return BadgeCheck;
    }
    if (normalized.includes('calibrat') || normalized.includes('final')) {
        return Sparkles;
    }

    return CircleDot;
}

function IconChip({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
    return (
        <span className={`bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${className ?? ''}`}>
            <Icon className="h-4 w-4" />
        </span>
    );
}

function SectionHeading({ icon: Icon, title, count }: { icon: LucideIcon; title: string; count: number }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
                <IconChip icon={Icon} />
                <div>
                    <div className="text-foreground text-sm font-semibold">{title}</div>
                    <div className="text-muted-foreground text-xs">
                        {count} record{count === 1 ? '' : 's'}
                    </div>
                </div>
            </div>
            <Badge variant="outline" className="gap-1 px-2 py-0.5">
                <Icon className="h-3 w-3" />
                {count}
            </Badge>
        </div>
    );
}

function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
    return (
        <div className="text-muted-foreground flex items-center gap-3 rounded-lg border border-dashed bg-muted/10 p-4 text-sm">
            <IconChip icon={Icon} className="bg-muted/30 text-muted-foreground" />
            <span>{message}</span>
        </div>
    );
}

function TimelineBody({ approvals, histories }: { approvals: AppraisalApproval[]; histories: AppraisalStatusHistory[] }) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
                <SectionHeading icon={BadgeCheck} title="Approval actions" count={approvals.length} />
                <div className="space-y-3">
                    {approvals.map((approval) => {
                        const stage = unwrap(approval.stage);
                        const action = unwrap(approval.action);
                        const ActionIcon = getActionIcon(action);
                        const StageIcon = getStageIcon(stage);

                        return (
                            <div key={approval.id} className="flex gap-3 rounded-lg border bg-muted/15 p-4">
                                <IconChip icon={ActionIcon} />
                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-[11px]">
                                            <StageIcon className="h-3 w-3" />
                                            {stage.replace(/_/g, ' ')}
                                        </Badge>
                                        <Badge variant="outline" className="gap-1 px-2 py-0.5 text-[11px]">
                                            <ActionIcon className="h-3 w-3" />
                                            {action.replace(/_/g, ' ')}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <User className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                        {approval.actor?.name ?? 'System'}
                                    </div>
                                    {approval.comments ? (
                                        <div className="text-foreground/75 flex items-start gap-2 text-[13px] leading-relaxed whitespace-pre-wrap">
                                            <MessageSquare className="text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0" />
                                            <span>{approval.comments}</span>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                    {approvals.length === 0 ? (
                        <EmptyState icon={Inbox} message="No approval actions captured yet." />
                    ) : null}
                </div>
            </div>

            <div className="space-y-4">
                <SectionHeading icon={History} title="Status history" count={histories.length} />
                <div className="space-y-3">
                    {histories.map((history) => {
                        const fromStatus = (unwrap(history.from_status) || 'start').replace(/_/g, ' ');
                        const toStatus = unwrap(history.to_status).replace(/_/g, ' ');

                        return (
                            <div key={history.id} className="flex gap-3 rounded-lg border bg-muted/15 p-4">
                                <IconChip icon={History} />
                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
                                        <Badge variant="outline" className="gap-1 px-2 py-0.5 normal-case">
                                            {fromStatus}
                                        </Badge>
                                        <ArrowRight className="text-muted-foreground h-3.5 w-3.5" />
                                        <Badge variant="secondary" className="gap-1 px-2 py-0.5 normal-case">
                                            {toStatus}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <User className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                        {history.actor?.name ?? 'System'}
                                    </div>
                                    {history.reason ? (
                                        <div className="text-foreground/75 flex items-start gap-2 text-[13px] leading-relaxed whitespace-pre-wrap">
                                            <MessageSquare className="text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0" />
                                            <span>{history.reason}</span>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                    {histories.length === 0 ? (
                        <EmptyState icon={History} message="No status transitions recorded yet." />
                    ) : null}
                </div>
            </div>
        </div>
    );
}

export default function ApprovalTimeline({ approvals, histories, embedded = false }: ApprovalTimelineProps) {
    if (embedded) {
        return <TimelineBody approvals={approvals} histories={histories} />;
    }

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <div className="font-mono-brand text-muted-foreground flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase">
                    <History className="h-3.5 w-3.5" />
                    § Workflow Timeline
                </div>
                <HeadingSmall title="Approvals & history" description="Approval actions and status changes." />
            </CardHeader>
            <CardContent>
                <TimelineBody approvals={approvals} histories={histories} />
            </CardContent>
        </Card>
    );
}
