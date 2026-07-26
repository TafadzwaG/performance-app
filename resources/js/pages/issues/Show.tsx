import IssueDetailsFormFields from '@/components/issues/issue-details-form-fields';
import PerformancePage from '@/components/performance/PerformancePage';
import { IssueStatusBadge } from '@/components/issues/issue-status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, formatDateTime } from '@/lib/date-utils';
import type { BreadcrumbItem } from '@/types';
import type { IssueOption, IssueReport, IssueStatus, IssueStatusHistory, IssueType } from '@/types/issues';
import { issueStatusLabels, issueTypeLabels } from '@/types/issues';
import { useForm } from '@inertiajs/react';
import {
    ArrowRightLeft,
    Bug,
    CheckCircle2,
    CircleDot,
    Clock3,
    Database,
    Gauge,
    KeyRound,
    Lightbulb,
    Loader2,
    MessageSquareText,
    PencilLine,
    Save,
    Sparkles,
    Ticket,
    UserRound,
    UserRoundCheck,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';

interface Props {
    issue: IssueReport;
    statusOptions: IssueOption[];
    typeOptions: IssueOption[];
    assigneeOptions: IssueOption[];
    can: { update: boolean; assign: boolean; updateStatus: boolean };
}

const statusSteps: IssueStatus[] = ['pending', 'in_progress', 'completed'];

const typeConfig: Record<IssueType, { icon: typeof Bug; accent: string }> = {
    bug: { icon: Bug, accent: 'text-red-600 dark:text-red-400' },
    access_login: { icon: KeyRound, accent: 'text-amber-600 dark:text-amber-400' },
    data_problem: { icon: Database, accent: 'text-violet-600 dark:text-violet-400' },
    performance: { icon: Gauge, accent: 'text-sky-600 dark:text-sky-400' },
    feature_request: { icon: Lightbulb, accent: 'text-emerald-600 dark:text-emerald-400' },
    other: { icon: Sparkles, accent: 'text-muted-foreground' },
};

export default function IssuesShow({ issue, statusOptions, typeOptions, assigneeOptions, can }: Props) {
    const [editOpen, setEditOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Issues', href: route('issues.index') },
        { title: issue.reference, href: route('issues.show', issue.id) },
    ];

    const assignForm = useForm<{ assignee_user_id: string; note: string }>({
        assignee_user_id: issue.assignee_user_id ? String(issue.assignee_user_id) : '',
        note: '',
    });

    const statusForm = useForm<{ status: IssueStatus | ''; note: string }>({
        status: issue.status,
        note: '',
    });

    const editForm = useForm<{ type: IssueType; title: string; description: string }>({
        type: issue.type,
        title: issue.title,
        description: issue.description,
    });

    const openEditDialog = () => {
        editForm.clearErrors();
        editForm.setData({
            type: issue.type,
            title: issue.title,
            description: issue.description,
        });
        setEditOpen(true);
    };

    const setEditDialogOpen = (nextOpen: boolean) => {
        setEditOpen(nextOpen);

        if (!nextOpen) {
            editForm.clearErrors();
        }
    };

    const submitEdit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        editForm.put(route('issues.update', issue.id), {
            preserveScroll: true,
            onSuccess: () => setEditDialogOpen(false),
        });
    };

    const submitAssign = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        assignForm.post(route('issues.assign', issue.id), { preserveScroll: true });
    };

    const submitStatus = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        statusForm.post(route('issues.status', issue.id), { preserveScroll: true });
    };

    const TypeIcon = typeConfig[issue.type].icon;
    const currentStepIndex = statusSteps.indexOf(issue.status);
    const histories = issue.histories ?? [];

    return (
        <PerformancePage
            title={issue.title}
            description={`Issue ${issue.reference}`}
            breadcrumbs={breadcrumbs}
            secondaryActions={
                can.update ? (
                    <Button type="button" variant="outline" onClick={openEditDialog}>
                        <PencilLine className="mr-2 h-4 w-4" />
                        Edit details
                    </Button>
                ) : undefined
            }
        >
            <div className="space-y-6">
                <div className="bg-card relative overflow-hidden rounded-2xl border p-6 shadow-sm lg:p-8">
                    <div className="bg-brand-sand/12 absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl" />
                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-5">
                            <div className="bg-secondary/40 text-foreground flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border">
                                <TypeIcon className={`h-7 w-7 ${typeConfig[issue.type].accent}`} />
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="font-mono-brand text-foreground/60 flex items-center gap-3 text-[11px] tracking-[0.22em] uppercase">
                                        <span className="bg-brand-sand inline-block h-px w-6" />
                                        <span>§ Issue ticket</span>
                                    </div>
                                    <h1 className="font-display text-balance text-foreground mt-3 text-3xl leading-[1.05] font-light tracking-tight lg:text-4xl">
                                        {issue.title}
                                    </h1>
                                    <p className="text-foreground/70 mt-3 flex flex-wrap items-center gap-2 text-[13px]">
                                        <Badge variant="secondary" className="font-mono text-[11px] tracking-wide">
                                            {issue.reference}
                                        </Badge>
                                        <Badge variant="outline">{issueTypeLabels[issue.type]}</Badge>
                                        <IssueStatusBadge status={issue.status} />
                                    </p>
                                </div>

                                <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
                                    <span>Reported {formatDateTime(issue.created_at)}</span>
                                    <span>Updated {formatDateTime(issue.updated_at)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid min-w-[220px] grid-cols-2 gap-3 lg:grid-cols-1">
                            <MetaStat label="Reporter" value={issue.reporter?.name ?? '—'} />
                            <MetaStat label="Assignee" value={issue.assignee?.name ?? 'Unassigned'} highlight={!issue.assignee} />
                        </div>
                    </div>

                    <div className="relative mt-8 border-t pt-6">
                        <div className="font-mono-brand text-muted-foreground mb-4 text-[10px] tracking-[0.22em] uppercase">
                            Resolution pipeline
                        </div>
                        <div className="grid gap-3 md:grid-cols-3">
                            {statusSteps.map((step, index) => {
                                const isComplete = index < currentStepIndex;
                                const isCurrent = index === currentStepIndex;

                                return (
                                    <div
                                        key={step}
                                        className={`rounded-xl border px-4 py-3 transition-colors ${
                                            isCurrent
                                                ? 'border-brand-sand/80 bg-brand-sand/10'
                                                : isComplete
                                                  ? 'border-emerald-500/20 bg-emerald-500/5'
                                                  : 'border-border bg-muted/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {isComplete ? (
                                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                            ) : isCurrent ? (
                                                <CircleDot className="text-brand-sand h-4 w-4" />
                                            ) : (
                                                <Clock3 className="text-muted-foreground h-4 w-4" />
                                            )}
                                            <span className="text-sm font-medium">{issueStatusLabels[step]}</span>
                                        </div>
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            {isCurrent ? 'Current stage' : isComplete ? 'Completed' : 'Upcoming'}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-12">
                    <div className="space-y-6 xl:col-span-8">
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="font-mono-brand text-muted-foreground flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase">
                                            <MessageSquareText className="h-3.5 w-3.5" />
                                            § Issue description
                                        </div>
                                        <CardTitle className="font-display mt-1 text-xl font-light tracking-tight">
                                            What was reported
                                        </CardTitle>
                                    </div>
                                    {can.update ? (
                                        <Button type="button" variant="outline" size="sm" onClick={openEditDialog}>
                                            <PencilLine className="mr-2 h-3.5 w-3.5" />
                                            Edit
                                        </Button>
                                    ) : null}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-xl border bg-muted/10 p-5">
                                    <p className="text-foreground whitespace-pre-wrap text-[13px] leading-7">
                                        {issue.description}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="font-mono-brand text-muted-foreground flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase">
                                    <Ticket className="h-3.5 w-3.5" />
                                    § Activity timeline
                                </div>
                                <CardTitle className="font-display mt-1 text-xl font-light tracking-tight">
                                    History
                                </CardTitle>
                                <CardDescription className="text-[13px]">
                                    Assignment changes, status updates, and handler notes.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {histories.length === 0 ? (
                                    <div className="text-muted-foreground rounded-xl border border-dashed px-6 py-10 text-center text-sm">
                                        No activity recorded yet. Assignment or status changes will appear here.
                                    </div>
                                ) : (
                                    <div className="relative space-y-0 pl-1">
                                        {histories.map((entry, index) => (
                                            <TimelineEntry
                                                key={entry.id}
                                                entry={entry}
                                                isLast={index === histories.length - 1}
                                            />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6 xl:col-span-4">
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="font-mono-brand text-muted-foreground flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase">
                                    <UserRoundCheck className="h-3.5 w-3.5" />
                                    § People
                                </div>
                                <CardTitle className="font-display mt-1 text-lg font-light tracking-tight">
                                    Ownership
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <PersonCard
                                    label="Reporter"
                                    name={issue.reporter?.name ?? 'Unknown'}
                                    email={issue.reporter?.email}
                                />
                                <PersonCard
                                    label="Assignee"
                                    name={issue.assignee?.name ?? 'Unassigned'}
                                    email={issue.assignee?.email}
                                    empty={!issue.assignee}
                                />
                            </CardContent>
                        </Card>

                        {can.assign ? (
                            <Card className="shadow-sm">
                                <CardHeader className="pb-3">
                                    <div className="font-mono-brand text-muted-foreground flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase">
                                        <UserRound className="h-3.5 w-3.5" />
                                        § Assignment
                                    </div>
                                    <CardTitle className="font-display mt-1 text-lg font-light tracking-tight">
                                        Assign handler
                                    </CardTitle>
                                    <CardDescription className="text-[13px]">
                                        Route this issue to a support team member.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={submitAssign} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="assignee_user_id">Assignee</Label>
                                            <Select
                                                value={assignForm.data.assignee_user_id}
                                                onValueChange={(value) => assignForm.setData('assignee_user_id', value)}
                                            >
                                                <SelectTrigger id="assignee_user_id">
                                                    <SelectValue placeholder="Select assignee" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {assigneeOptions.map((option) => (
                                                        <SelectItem key={String(option.value)} value={String(option.value)}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="assign-note">Note</Label>
                                            <textarea
                                                id="assign-note"
                                                rows={3}
                                                className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                                placeholder="Optional context for the assignee..."
                                                value={assignForm.data.note}
                                                onChange={(event) => assignForm.setData('note', event.target.value)}
                                            />
                                        </div>
                                        <Button type="submit" className="w-full" disabled={assignForm.processing || !assignForm.data.assignee_user_id}>
                                            {assignForm.processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Assign issue
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        ) : null}

                        {can.updateStatus ? (
                            <Card className="shadow-sm">
                                <CardHeader className="pb-3">
                                    <div className="font-mono-brand text-muted-foreground flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase">
                                        <ArrowRightLeft className="h-3.5 w-3.5" />
                                        § Status
                                    </div>
                                    <CardTitle className="font-display mt-1 text-lg font-light tracking-tight">
                                        Update status
                                    </CardTitle>
                                    <CardDescription className="text-[13px]">
                                        Move the issue through the resolution pipeline.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={submitStatus} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="status">Status</Label>
                                            <Select
                                                value={statusForm.data.status}
                                                onValueChange={(value) => statusForm.setData('status', value as IssueStatus)}
                                            >
                                                <SelectTrigger id="status">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {statusOptions.map((option) => (
                                                        <SelectItem key={option.value} value={String(option.value)}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="status-note">
                                                Note {statusForm.data.status === 'completed' ? '(required)' : '(optional)'}
                                            </Label>
                                            <textarea
                                                id="status-note"
                                                rows={3}
                                                className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                                placeholder={
                                                    statusForm.data.status === 'completed'
                                                        ? 'Describe how this issue was resolved...'
                                                        : 'Optional update for the reporter...'
                                                }
                                                value={statusForm.data.note}
                                                onChange={(event) => statusForm.setData('note', event.target.value)}
                                            />
                                        </div>
                                        <Button type="submit" className="w-full" disabled={statusForm.processing}>
                                            {statusForm.processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Save status
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        ) : null}

                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                    § Ticket metadata
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <MetaRow label="Reference" value={issue.reference} mono />
                                <MetaRow label="Type" value={issueTypeLabels[issue.type]} />
                                <MetaRow label="Status" value={issueStatusLabels[issue.status]} />
                                <MetaRow label="Created" value={formatDate(issue.created_at)} />
                                <MetaRow label="Last updated" value={formatDateTime(issue.updated_at)} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {can.update ? (
                <Dialog open={editOpen} onOpenChange={setEditDialogOpen}>
                    <DialogContent className="bg-card w-[calc(100vw-2rem)] sm:max-w-2xl">
                        <DialogHeader className="border-foreground/10 border-b pb-4">
                            <div className="font-mono-brand text-foreground/60 text-[10px] tracking-[0.22em] uppercase">
                                Issue ticket
                            </div>
                            <DialogTitle className="font-display mt-1 text-2xl font-light tracking-tight">
                                Edit issue details
                            </DialogTitle>
                            <DialogDescription className="text-foreground/70 mt-2 text-[13px] leading-relaxed">
                                Update the type, title, or description for {issue.reference}.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={submitEdit} className="space-y-5 pt-1">
                            <IssueDetailsFormFields
                                idPrefix="show-issue"
                                type={editForm.data.type}
                                title={editForm.data.title}
                                description={editForm.data.description}
                                typeOptions={typeOptions}
                                errors={editForm.errors}
                                onTypeChange={(value) => editForm.setData('type', value)}
                                onTitleChange={(value) => editForm.setData('title', value)}
                                onDescriptionChange={(value) => editForm.setData('description', value)}
                            />

                            <div className="flex flex-wrap gap-3 border-t pt-4">
                                <Button type="submit" disabled={editForm.processing}>
                                    {editForm.processing ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Save changes
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            ) : null}
        </PerformancePage>
    );
}

function MetaStat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="rounded-xl border bg-muted/20 px-4 py-3">
            <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">{label}</div>
            <div className={`font-display mt-1 text-lg font-light tracking-tight ${highlight ? 'text-muted-foreground' : 'text-foreground'}`}>
                {value}
            </div>
        </div>
    );
}

function MetaRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0">
            <span className="text-muted-foreground">{label}</span>
            <span className={`text-foreground text-right font-medium ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
        </div>
    );
}

function PersonCard({
    label,
    name,
    email,
    empty = false,
}: {
    label: string;
    name: string;
    email?: string;
    empty?: boolean;
}) {
    const initials = name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');

    return (
        <div className="flex items-center gap-3 rounded-xl border bg-muted/10 p-4">
            <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-sm font-medium ${
                    empty ? 'bg-muted text-muted-foreground' : 'bg-background text-foreground'
                }`}
            >
                {empty ? '—' : initials}
            </div>
            <div className="min-w-0">
                <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">{label}</div>
                <div className={`truncate text-sm font-medium ${empty ? 'text-muted-foreground' : 'text-foreground'}`}>{name}</div>
                {email ? <div className="text-muted-foreground truncate text-xs">{email}</div> : null}
            </div>
        </div>
    );
}

function TimelineEntry({ entry, isLast }: { entry: IssueStatusHistory; isLast: boolean }) {
    const hasStatusChange = entry.from_status || entry.to_status;
    const hasAssigneeChange = entry.from_assignee || entry.to_assignee;

    let icon: ReactNode = <ArrowRightLeft className="h-3.5 w-3.5" />;
    let title = 'Issue updated';

    if (hasStatusChange && hasAssigneeChange) {
        title = 'Status and assignee updated';
    } else if (hasStatusChange) {
        title = 'Status updated';
        icon = <CheckCircle2 className="h-3.5 w-3.5" />;
    } else if (hasAssigneeChange) {
        title = 'Assignee updated';
        icon = <UserRound className="h-3.5 w-3.5" />;
    }

    return (
        <div className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast ? <span className="bg-border absolute top-8 left-[15px] h-[calc(100%-12px)] w-px" aria-hidden /> : null}

            <div className="bg-background text-muted-foreground relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border">
                {icon}
            </div>

            <div className="min-w-0 flex-1 rounded-xl border bg-muted/10 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                        <div className="text-foreground text-sm font-medium">{title}</div>
                        <div className="text-muted-foreground mt-0.5 text-xs">
                            {entry.actor?.name ?? 'System'} · {formatDateTime(entry.created_at)}
                        </div>
                    </div>
                </div>

                <div className="mt-3 space-y-2 text-sm">
                    {hasStatusChange ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-muted-foreground">Status</span>
                            {entry.from_status ? <IssueStatusBadge status={entry.from_status} /> : <Badge variant="outline">—</Badge>}
                            <span className="text-muted-foreground">→</span>
                            {entry.to_status ? <IssueStatusBadge status={entry.to_status} /> : <Badge variant="outline">—</Badge>}
                        </div>
                    ) : null}

                    {hasAssigneeChange ? (
                        <div className="text-muted-foreground">
                            Assignee:{' '}
                            <span className="text-foreground">{entry.from_assignee?.name ?? 'Unassigned'}</span>
                            {' → '}
                            <span className="text-foreground">{entry.to_assignee?.name ?? 'Unassigned'}</span>
                        </div>
                    ) : null}

                    {entry.note ? (
                        <div className="rounded-lg border bg-background px-3 py-2 text-[13px] leading-6 text-foreground">
                            {entry.note}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
