import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { IssueStatusBadge } from '@/components/issues/issue-status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import type { IssueFilters, IssuePaginated, IssueOption } from '@/types/issues';
import { issueTypeLabels } from '@/types/issues';
import { Link, router } from '@inertiajs/react';
import { Eye, Filter, Plus, Search, Ticket } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';

interface Props {
    issues: IssuePaginated;
    filters: IssueFilters;
    statusOptions: IssueOption[];
    typeOptions: IssueOption[];
    assigneeOptions: IssueOption[];
    reporterOptions: IssueOption[];
    can: { create: boolean; viewAll: boolean; assign: boolean; updateStatus: boolean };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Issues', href: route('issues.index') },
];

const selectClassName =
    'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function IssuesIndex({
    issues,
    filters,
    statusOptions,
    typeOptions,
    assigneeOptions,
    reporterOptions,
    can,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [type, setType] = useState(filters.type ?? '');
    const [assigneeUserId, setAssigneeUserId] = useState(filters.assignee_user_id ?? '');
    const [reporterUserId, setReporterUserId] = useState(filters.reporter_user_id ?? '');

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            route('issues.index'),
            {
                search,
                status: status || undefined,
                type: type || undefined,
                assignee_user_id: assigneeUserId || undefined,
                reporter_user_id: reporterUserId || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <PerformancePage
            title="Issues"
            description="Report system problems and track them from pending through completion."
            breadcrumbs={breadcrumbs}
            primaryAction={
                can.create
                    ? { label: 'Report issue', href: route('issues.create'), icon: <Plus className="h-4 w-4" /> }
                    : undefined
            }
        >
            <div className="space-y-6">
                <Card className="shadow-sm">
                    <CardHeader className="border-b bg-muted/20">
                        <CardTitle className="text-lg">Search & filter</CardTitle>
                        <CardDescription>Find issues by reference, title, status, type, reporter, or assignee.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={submit} className="grid gap-4 lg:grid-cols-3">
                            <div className="space-y-2 lg:col-span-3">
                                <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Search</label>
                                <div className="relative">
                                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                    <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Search title, description, or ID" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Status</label>
                                <select className={selectClassName} value={status} onChange={(e) => setStatus(e.target.value)}>
                                    <option value="">All statuses</option>
                                    {statusOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Type</label>
                                <select className={selectClassName} value={type} onChange={(e) => setType(e.target.value)}>
                                    <option value="">All types</option>
                                    {typeOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            {can.viewAll ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Reporter</label>
                                        <select className={selectClassName} value={reporterUserId} onChange={(e) => setReporterUserId(e.target.value)}>
                                            <option value="">All reporters</option>
                                            {reporterOptions.map((option) => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Assignee</label>
                                        <select className={selectClassName} value={assigneeUserId} onChange={(e) => setAssigneeUserId(e.target.value)}>
                                            <option value="">All assignees</option>
                                            {assigneeOptions.map((option) => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            ) : null}
                            <div className="flex items-end lg:col-span-3">
                                <Button type="submit" variant="outline">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Apply filters
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="border-b bg-muted/20">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Ticket className="h-5 w-5" />
                            Issue list
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {issues.data.length === 0 ? (
                            <div className="text-muted-foreground p-10 text-center text-sm">No issues match your filters.</div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-muted/30 text-left">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold">Reference</th>
                                                <th className="px-6 py-4 font-semibold">Title</th>
                                                <th className="px-6 py-4 font-semibold">Type</th>
                                                <th className="px-6 py-4 font-semibold">Status</th>
                                                <th className="px-6 py-4 font-semibold">Reporter</th>
                                                <th className="px-6 py-4 font-semibold">Assignee</th>
                                                <th className="px-6 py-4 text-right font-semibold">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {issues.data.map((issue) => (
                                                <tr key={issue.id} className="hover:bg-muted/20 border-t">
                                                    <td className="px-6 py-4 font-mono text-xs">{issue.reference}</td>
                                                    <td className="px-6 py-4 font-medium">{issue.title}</td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="secondary">{issueTypeLabels[issue.type]}</Badge>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <IssueStatusBadge status={issue.status} />
                                                    </td>
                                                    <td className="text-muted-foreground px-6 py-4">{issue.reporter?.name ?? '—'}</td>
                                                    <td className="text-muted-foreground px-6 py-4">{issue.assignee?.name ?? 'Unassigned'}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button asChild variant="outline" size="sm">
                                                            <Link href={route('issues.show', issue.id)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View
                                                            </Link>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="border-t px-6 py-4">
                                    <PaginationLinks paginated={issues} />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PerformancePage>
    );
}
