import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/lib/date-utils';
import type { BreadcrumbItem } from '@/types';
import type { AuditTrailRecord, Option, Paginated } from '@/types/performance';
import { router } from '@inertiajs/react';
import { AlertTriangle, History, RefreshCw, Search, ShieldAlert, UserCog, Users } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface Props {
    auditTrails: Paginated<AuditTrailRecord>;
    filters: {
        search?: string;
        method?: string;
        status?: string;
    };
    summary: {
        total: number;
        today: number;
        unique_actors: number;
        impersonated: number;
        failed: number;
    };
    methodOptions: Option[];
    statusOptions: Option[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/dashboard' },
    { title: 'Audit Trail', href: route('access.audit-trails.index') },
];

export default function AuditTrailIndex({
    auditTrails,
    filters,
    summary,
    methodOptions,
    statusOptions,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [method, setMethod] = useState(filters.method ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    const applyFilters = () => {
        router.get(
            route('access.audit-trails.index'),
            {
                search: search || undefined,
                method: method || undefined,
                status: status || undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const resetFilters = () => {
        setSearch('');
        setMethod('');
        setStatus('');

        router.get(route('access.audit-trails.index'), {}, { preserveScroll: true, replace: true });
    };

    return (
        <PerformancePage
            title="Audit Trail"
            description="Review recorded system actions across authentication, access management, setup, and workflow changes."
            breadcrumbs={breadcrumbs}
            secondaryActions={
                <Button type="button" variant="outline" size="sm" onClick={() => router.reload({ only: ['auditTrails', 'summary'] })}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            }
        >
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-5">
                    <SummaryCard icon={<History className="h-4 w-4" />} label="Total Events" value={summary.total} />
                    <SummaryCard icon={<ShieldAlert className="h-4 w-4" />} label="Today" value={summary.today} />
                    <SummaryCard icon={<Users className="h-4 w-4" />} label="Unique Actors" value={summary.unique_actors} />
                    <SummaryCard icon={<UserCog className="h-4 w-4" />} label="Impersonated" value={summary.impersonated} />
                    <SummaryCard icon={<AlertTriangle className="h-4 w-4" />} label="Failed" value={summary.failed} />
                </div>

                <Card>
                    <CardHeader>
                        <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                            Filters
                        </CardDescription>
                        <CardTitle>Find activity</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_180px_180px_auto]">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search actor, action, route, subject, or IP"
                                className="pl-9"
                            />
                        </div>

                        <select
                            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={method}
                            onChange={(event) => setMethod(event.target.value)}
                        >
                            {methodOptions.map((option) => (
                                <option key={option.value} value={String(option.value)}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <select
                            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value} value={String(option.value)}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <div className="flex gap-2">
                            <Button type="button" size="sm" onClick={applyFilters}>
                                Apply
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                                Clear
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                            Recorded Activity
                        </CardDescription>
                        <CardTitle>System actions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="border-b bg-muted/30">
                                    <tr>
                                        <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">When</th>
                                        <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Actor</th>
                                        <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Action</th>
                                        <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Subject / Route</th>
                                        <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Request</th>
                                        <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Payload</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditTrails.data.length > 0 ? (
                                        auditTrails.data.map((audit) => (
                                            <tr key={audit.id} className="border-t align-top transition-colors hover:bg-muted/20">
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="font-medium text-foreground">{formatDateTime(audit.occurred_at)}</div>
                                                    <div className="text-xs text-muted-foreground">#{audit.id}</div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="space-y-1">
                                                        <div className="font-medium text-foreground">
                                                            {audit.user?.name ?? 'Guest / system'}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {audit.user?.email ?? audit.ip_address ?? 'No actor email'}
                                                        </div>
                                                        {audit.impersonator ? (
                                                            <Badge variant="outline">via {audit.impersonator.name}</Badge>
                                                        ) : null}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="space-y-2">
                                                        <Badge variant="secondary">{formatAction(audit.action)}</Badge>
                                                        <div className="text-xs text-muted-foreground">{audit.route_name ?? 'Unnamed route'}</div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="space-y-1">
                                                        <div className="font-medium text-foreground">
                                                            {audit.subject_label ?? 'No subject'}
                                                        </div>
                                                        <div className="max-w-xs truncate text-xs text-muted-foreground">{audit.url}</div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="space-y-2">
                                                        <div className="flex flex-wrap gap-2">
                                                            <Badge variant="outline">{audit.method}</Badge>
                                                            <Badge variant={audit.response_status >= 400 ? 'destructive' : 'secondary'}>
                                                                {audit.response_status}
                                                            </Badge>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {audit.ip_address ?? 'No IP recorded'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="max-w-sm text-xs leading-5 text-muted-foreground">
                                                        {payloadPreview(audit.request_payload)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-14 text-center">
                                                <div className="mx-auto max-w-md space-y-2">
                                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-muted text-muted-foreground">
                                                        <History className="h-5 w-5" />
                                                    </div>
                                                    <h3 className="text-base font-semibold text-foreground">No audit entries found</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Adjust the filters or perform a few actions in the system to populate the audit trail.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {auditTrails.links.length > 0 ? (
                            <div className="border-t px-5 py-4">
                                <PaginationLinks paginated={auditTrails} />
                            </div>
                        ) : null}
                    </CardContent>
                </Card>
            </div>
        </PerformancePage>
    );
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
    return (
        <Card>
            <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-lg border bg-muted p-3 text-foreground">{icon}</div>
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="text-lg font-semibold">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function formatAction(value: string) {
    return value
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function payloadPreview(payload?: Record<string, unknown> | null) {
    if (!payload || Object.keys(payload).length === 0) {
        return 'No payload recorded';
    }

    return Object.entries(payload)
        .slice(0, 4)
        .map(([key, value]) => `${key}: ${formatPayloadValue(value)}`)
        .join(' | ');
}

function formatPayloadValue(value: unknown): string {
    if (Array.isArray(value)) {
        return `[${value.length} items]`;
    }

    if (value && typeof value === 'object') {
        return '{...}';
    }

    if (value === null || value === undefined || value === '') {
        return 'empty';
    }

    return String(value);
}
