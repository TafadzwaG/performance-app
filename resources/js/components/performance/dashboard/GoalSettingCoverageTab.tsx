import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { GoalSettingCoverageReport, GoalSettingCoverageScope } from '@/types/performance';
import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Briefcase,
    Building2,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Search,
    Target,
    UserRound,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface Props {
    coverage: GoalSettingCoverageReport;
}

type FilterMode = 'all' | 'blocked' | 'ready';

function issueLabel(issue: string) {
    switch (issue) {
        case 'no_kpis':
            return 'No KPIs';
        case 'invalid_weights':
            return 'Weights not 100%';
        case 'zero_weight':
            return 'Zero weight KPI';
        case 'below_minimum':
            return 'Below minimum';
        case 'above_maximum':
            return 'Above maximum';
        default:
            return issue;
    }
}

function goalLibraryHref(scope: GoalSettingCoverageScope) {
    const params = new URLSearchParams({
        department_id: String(scope.department_id),
        job_title_id: String(scope.job_title_id),
    });

    return `${route('performance.goal_library.index')}?${params.toString()}`;
}

function ScopeRow({ scope }: { scope: GoalSettingCoverageScope }) {
    const [expanded, setExpanded] = useState(false);
    const isBlocked = scope.status === 'blocked';

    return (
        <>
            <TableRow className={isBlocked ? 'bg-amber-50/60 dark:bg-amber-950/10' : undefined}>
                <TableCell>
                    <div className="font-medium">{scope.department_name}</div>
                </TableCell>
                <TableCell>{scope.job_title_name}</TableCell>
                <TableCell className="text-right tabular-nums">{scope.kpi_count}</TableCell>
                <TableCell className="text-right tabular-nums">{scope.kpi_weight_total.toFixed(2)}%</TableCell>
                <TableCell className="text-right tabular-nums">{scope.employee_count}</TableCell>
                <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                        {isBlocked ? (
                            scope.issues.map((issue) => (
                                <Badge key={issue} variant="outline" className="border-amber-300 text-amber-900 dark:text-amber-100">
                                    {issueLabel(issue)}
                                </Badge>
                            ))
                        ) : (
                            <Badge variant="outline" className="border-emerald-300 text-emerald-800 dark:text-emerald-200">
                                Ready
                            </Badge>
                        )}
                    </div>
                </TableCell>
                <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => setExpanded((value) => !value)}>
                            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </Button>
                        <Button asChild variant="outline" size="sm">
                            <Link href={goalLibraryHref(scope)}>
                                <Target className="size-4" />
                                Manage KPIs
                            </Link>
                        </Button>
                    </div>
                </TableCell>
            </TableRow>
            {expanded ? (
                <TableRow>
                    <TableCell colSpan={7} className="bg-muted/20 p-0">
                        <div className="space-y-3 px-4 py-4">
                            {scope.issue_messages.length > 0 ? (
                                <div className="rounded-lg border border-amber-300/70 bg-amber-50/80 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100">
                                    {scope.issue_messages.join(' ')}
                                </div>
                            ) : null}
                            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                {scope.employees.map((employee) => (
                                    <div key={employee.id} className="bg-background flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                                        <div className="min-w-0">
                                            <div className="truncate font-medium">{employee.name}</div>
                                            <div className="text-muted-foreground truncate text-xs">
                                                {employee.employee_number ? `#${employee.employee_number}` : 'No employee number'}
                                                {employee.email ? ` · ${employee.email}` : ''}
                                            </div>
                                        </div>
                                        <Button asChild variant="ghost" size="icon">
                                            <Link href={route('performance.employees.edit', employee.id)}>
                                                <UserRound className="size-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            ) : null}
        </>
    );
}

export default function GoalSettingCoverageTab({ coverage }: Props) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterMode>('blocked');

    const filteredScopes = useMemo(() => {
        const query = search.trim().toLowerCase();

        return coverage.scopes.filter((scope) => {
            if (filter === 'blocked' && scope.status !== 'blocked') {
                return false;
            }

            if (filter === 'ready' && scope.status !== 'ready') {
                return false;
            }

            if (!query) {
                return true;
            }

            const haystack = [
                scope.department_name,
                scope.job_title_name,
                ...scope.issue_messages,
                ...scope.employees.map((employee) => `${employee.name} ${employee.employee_number ?? ''} ${employee.email ?? ''}`),
            ]
                .join(' ')
                .toLowerCase();

            return haystack.includes(query);
        });
    }, [coverage.scopes, filter, search]);

    const template = coverage.template;

    return (
        <div className="space-y-6">
            <Card className="overflow-hidden border shadow-sm">
                <CardContent className="bg-muted/15 border-b px-6 py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <Badge variant="secondary" className="mb-3 w-fit">
                                {coverage.organization.name ?? 'Organization'}
                            </Badge>
                            <h2 className="text-foreground text-2xl font-bold tracking-tight">Goal setting readiness</h2>
                            <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-6">
                                Review every department and job title in this organization. Each role needs active My KPIs that total 100% and meet
                                the appraisal template objective range before review cycles can open cleanly.
                            </p>
                        </div>
                        <div className="bg-background min-w-[240px] rounded-xl border px-4 py-3 text-sm">
                            <div className="text-muted-foreground text-[11px] font-semibold tracking-[0.16em] uppercase">Template rules</div>
                            <div className="text-foreground mt-2 font-semibold">{template.name}</div>
                            <div className="text-muted-foreground mt-1">
                                {template.min_objectives}–{template.max_objectives} KPIs required
                            </div>
                            <div className="text-muted-foreground mt-2 text-xs">
                                {template.source === 'open_cycle' && template.cycle_name
                                    ? `Using open cycle: ${template.cycle_name}`
                                    : template.source === 'default_template'
                                      ? 'Using default active appraisal template'
                                      : 'Using standard fallback rules'}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: 'Eligible employees', value: coverage.summary.eligible_employees, icon: Users, tone: 'text-sky-600' },
                    { label: 'Blocked employees', value: coverage.summary.employees_blocked, icon: AlertTriangle, tone: 'text-amber-600' },
                    { label: 'Blocked role scopes', value: coverage.summary.blocked_scopes, icon: Briefcase, tone: 'text-orange-600' },
                    { label: 'Departments with gaps', value: coverage.summary.departments_with_gaps, icon: Building2, tone: 'text-rose-600' },
                ].map((item) => {
                    const Icon = item.icon;
                    return (
                        <Card key={item.label} className="shadow-sm">
                            <CardContent className="flex items-center justify-between gap-4 p-5">
                                <div>
                                    <div className="text-muted-foreground text-[11px] font-semibold tracking-[0.16em] uppercase">{item.label}</div>
                                    <div className="text-foreground mt-2 text-3xl font-bold tabular-nums">{item.value}</div>
                                </div>
                                <div className="bg-muted/20 flex h-11 w-11 items-center justify-center rounded-xl border">
                                    <Icon className={cn('size-5', item.tone)} />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_1.9fr]">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="text-muted-foreground size-5" />
                            Department summary
                        </CardTitle>
                        <CardDescription>Departments with job titles that still need KPI fixes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {coverage.departments.filter((department) => department.blocked_scope_count > 0).length > 0 ? (
                            coverage.departments
                                .filter((department) => department.blocked_scope_count > 0)
                                .map((department) => (
                                    <div key={department.department_id} className="rounded-xl border px-4 py-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="font-medium">{department.department_name}</div>
                                                <div className="text-muted-foreground mt-1 text-xs">
                                                    {department.blocked_scope_count} of {department.scope_count} role scope
                                                    {department.scope_count === 1 ? '' : 's'} blocked
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="border-amber-300 text-amber-900 dark:text-amber-100">
                                                {department.employees_blocked} employees
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                        ) : (
                            <div className="text-muted-foreground rounded-xl border border-dashed px-4 py-8 text-center text-sm">
                                <CheckCircle2 className="mx-auto mb-3 size-8 text-emerald-600" />
                                All department role scopes currently meet the template KPI rules.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="text-muted-foreground size-5" />
                            Role scopes
                        </CardTitle>
                        <CardDescription>Department + job title combinations and the employees affected.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="relative max-w-md flex-1">
                                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                <Input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search department, job title, employee..."
                                    className="pl-9"
                                />
                            </div>
                            <div className="bg-muted/20 flex w-fit rounded-lg border p-1">
                                {([
                                    ['blocked', 'Blocked'],
                                    ['all', 'All'],
                                    ['ready', 'Ready'],
                                ] as const).map(([value, label]) => (
                                    <Button
                                        key={value}
                                        type="button"
                                        size="sm"
                                        variant={filter === value ? 'default' : 'ghost'}
                                        onClick={() => setFilter(value)}
                                    >
                                        {label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Job title</TableHead>
                                        <TableHead className="text-right">KPIs</TableHead>
                                        <TableHead className="text-right">Weight</TableHead>
                                        <TableHead className="text-right">People</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredScopes.length > 0 ? (
                                        filteredScopes.map((scope) => <ScopeRow key={`${scope.department_id}:${scope.job_title_id}`} scope={scope} />)
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-muted-foreground py-10 text-center text-sm">
                                                No role scopes match the current filters.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {coverage.incomplete_profiles.length > 0 ? (
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserRound className="text-muted-foreground size-5" />
                            Incomplete employee profiles
                        </CardTitle>
                        <CardDescription>
                            These review-eligible employees are missing a department or job title, so My KPI matching cannot run for them.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {coverage.incomplete_profiles.map((employee) => (
                                <div key={employee.id} className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
                                    <div className="min-w-0">
                                        <div className="truncate font-medium">{employee.name}</div>
                                        <div className="text-muted-foreground truncate text-xs">
                                            {employee.department_name ?? 'No department'} · {employee.job_title_name ?? 'No job title'}
                                        </div>
                                    </div>
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={route('performance.employees.edit', employee.id)}>
                                            <ExternalLink className="size-4" />
                                            Fix profile
                                        </Link>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
}
