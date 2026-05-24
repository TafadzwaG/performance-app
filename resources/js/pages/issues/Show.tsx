import PerformancePage from '@/components/performance/PerformancePage';
import { IssueStatusBadge } from '@/components/issues/issue-status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';
import type { IssueOption, IssueReport, IssueStatus, IssueType } from '@/types/issues';
import { issueStatusLabels, issueTypeLabels } from '@/types/issues';
import { Link, router, useForm } from '@inertiajs/react';
import { Clock3, Loader2, PencilLine, UserRound } from 'lucide-react';
import type { FormEvent } from 'react';

interface Props {
    issue: IssueReport;
    statusOptions: IssueOption[];
    typeOptions: IssueOption[];
    assigneeOptions: IssueOption[];
    can: { update: boolean; assign: boolean; updateStatus: boolean };
}

const selectClassName =
    'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function IssuesShow({ issue, statusOptions, assigneeOptions, can }: Props) {
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

    const submitAssign = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        assignForm.post(route('issues.assign', issue.id), { preserveScroll: true });
    };

    const submitStatus = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        statusForm.post(route('issues.status', issue.id), { preserveScroll: true });
    };

    return (
        <PerformancePage
            title={issue.title}
            description={`Issue ${issue.reference}`}
            breadcrumbs={breadcrumbs}
            secondaryActions={
                can.update ? (
                    <Button asChild variant="outline">
                        <Link href={route('issues.edit', issue.id)}>
                            <PencilLine className="mr-2 h-4 w-4" />
                            Manage
                        </Link>
                    </Button>
                ) : undefined
            }
        >
            <div className="grid gap-6 xl:grid-cols-12">
                <div className="space-y-6 xl:col-span-8">
                    <Card className="shadow-sm">
                        <CardHeader className="border-b bg-muted/20">
                            <div className="flex flex-wrap items-center gap-3">
                                <CardTitle>{issue.reference}</CardTitle>
                                <IssueStatusBadge status={issue.status} />
                                <Badge variant="secondary">{issueTypeLabels[issue.type]}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 p-6">
                            <div>
                                <div className="text-muted-foreground text-xs uppercase tracking-wide">Description</div>
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{issue.description}</p>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <div className="text-muted-foreground text-xs uppercase tracking-wide">Reporter</div>
                                    <div className="mt-1 font-medium">{issue.reporter?.name ?? '—'}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground text-xs uppercase tracking-wide">Assignee</div>
                                    <div className="mt-1 font-medium">{issue.assignee?.name ?? 'Unassigned'}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="border-b bg-muted/20">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Clock3 className="h-5 w-5" />
                                Timeline
                            </CardTitle>
                            <CardDescription>Assignment and status changes for this issue.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 p-6">
                            {(issue.histories ?? []).length === 0 ? (
                                <p className="text-muted-foreground text-sm">No history recorded yet.</p>
                            ) : (
                                (issue.histories ?? []).map((entry) => (
                                    <div key={entry.id} className="border-foreground/10 rounded-lg border p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="font-medium">{entry.actor?.name ?? 'System'}</div>
                                            <div className="text-muted-foreground text-xs">{new Date(entry.created_at).toLocaleString()}</div>
                                        </div>
                                        <div className="text-muted-foreground mt-2 text-sm">
                                            {entry.from_status || entry.to_status ? (
                                                <span>
                                                    Status: {entry.from_status ? issueStatusLabels[entry.from_status] : '—'} →{' '}
                                                    {entry.to_status ? issueStatusLabels[entry.to_status] : '—'}
                                                </span>
                                            ) : null}
                                            {entry.from_assignee || entry.to_assignee ? (
                                                <div className="mt-1">
                                                    Assignee: {entry.from_assignee?.name ?? 'Unassigned'} → {entry.to_assignee?.name ?? 'Unassigned'}
                                                </div>
                                            ) : null}
                                        </div>
                                        {entry.note ? <p className="mt-2 text-sm leading-relaxed">{entry.note}</p> : null}
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6 xl:col-span-4">
                    {can.assign ? (
                        <Card className="shadow-sm">
                            <CardHeader className="border-b bg-muted/20">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <UserRound className="h-5 w-5" />
                                    Assign handler
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={submitAssign} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="assignee_user_id">Assignee</Label>
                                        <select
                                            id="assignee_user_id"
                                            className={selectClassName}
                                            value={assignForm.data.assignee_user_id}
                                            onChange={(event) => assignForm.setData('assignee_user_id', event.target.value)}
                                            required
                                        >
                                            <option value="">Select assignee</option>
                                            {assigneeOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="assign-note">Note</Label>
                                        <textarea
                                            id="assign-note"
                                            rows={3}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={assignForm.data.note}
                                            onChange={(event) => assignForm.setData('note', event.target.value)}
                                        />
                                    </div>
                                    <Button type="submit" disabled={assignForm.processing}>
                                        {assignForm.processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Assign issue
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    ) : null}

                    {can.updateStatus ? (
                        <Card className="shadow-sm">
                            <CardHeader className="border-b bg-muted/20">
                                <CardTitle className="text-lg">Update status</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={submitStatus} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <select
                                            id="status"
                                            className={selectClassName}
                                            value={statusForm.data.status}
                                            onChange={(event) => statusForm.setData('status', event.target.value as IssueStatus)}
                                            required
                                        >
                                            {statusOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="status-note">Note {statusForm.data.status === 'completed' ? '(required)' : ''}</Label>
                                        <textarea
                                            id="status-note"
                                            rows={3}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={statusForm.data.note}
                                            onChange={(event) => statusForm.setData('note', event.target.value)}
                                        />
                                    </div>
                                    <Button type="submit" disabled={statusForm.processing}>
                                        {statusForm.processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Update status
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    ) : null}
                </div>
            </div>
        </PerformancePage>
    );
}
