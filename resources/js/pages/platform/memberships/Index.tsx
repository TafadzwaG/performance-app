import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateTime } from '@/lib/date-utils';
import type { BreadcrumbItem } from '@/types';
import type { Option, Paginated } from '@/types/performance';
import { Link, router, useForm } from '@inertiajs/react';
import {
    Building2,
    Check,
    FileSpreadsheet,
    FileText,
    Mail,
    MapPin,
    RotateCcw,
    Search,
    ShieldCheck,
    Star,
    UserRound,
    Users,
} from 'lucide-react';
import type { FormEvent } from 'react';

interface MembershipRecord {
    id: number;
    status: string;
    is_default: boolean;
    access_all_locations: boolean;
    activated_at: string | null;
    organization: {
        id: number;
        name: string;
        slug: string;
        status: string;
    } | null;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
}

interface Props {
    memberships: Paginated<MembershipRecord>;
    filters: {
        search: string;
        status: string;
        organization_id: number | null;
    };
    stats: {
        total: number;
        active: number;
        organizations: number;
        default: number;
    };
    organizationOptions: Option[];
}

const ALL_FILTER_VALUE = 'all';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Platform administration', href: '/platform/organizations' },
    { title: 'Memberships', href: '/platform/memberships' },
];

function getInitials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

export default function PlatformMemberships({ memberships, filters, stats, organizationOptions }: Props) {
    const filterForm = useForm({
        search: filters.search ?? '',
        status: filters.status ?? ALL_FILTER_VALUE,
        organization_id: filters.organization_id ? String(filters.organization_id) : ALL_FILTER_VALUE,
    });

    const applyFilters = (event?: FormEvent) => {
        event?.preventDefault();

        router.get(
            route('platform.memberships.index'),
            {
                search: filterForm.data.search || undefined,
                status: filterForm.data.status === ALL_FILTER_VALUE ? undefined : filterForm.data.status,
                organization_id:
                    filterForm.data.organization_id === ALL_FILTER_VALUE ? undefined : filterForm.data.organization_id,
            },
            { preserveState: true, replace: true },
        );
    };

    const resetFilters = () => {
        filterForm.setData({
            search: '',
            status: ALL_FILTER_VALUE,
            organization_id: ALL_FILTER_VALUE,
        });
        router.get(route('platform.memberships.index'), {}, { preserveState: true, replace: true });
    };

    const buildExportUrl = (format: 'xlsx' | 'pdf') => {
        const url = new URL(route('platform.memberships.export'), window.location.origin);
        url.searchParams.set('format', format);

        if (filterForm.data.search) {
            url.searchParams.set('search', filterForm.data.search);
        }
        if (filterForm.data.status !== ALL_FILTER_VALUE) {
            url.searchParams.set('status', filterForm.data.status);
        }
        if (filterForm.data.organization_id !== ALL_FILTER_VALUE) {
            url.searchParams.set('organization_id', filterForm.data.organization_id);
        }

        return url.toString();
    };

    return (
        <PerformancePage
            title="Platform memberships"
            description="Search, review, and export organization memberships across all tenants."
            breadcrumbs={breadcrumbs}
            secondaryActions={
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <a href={buildExportUrl('pdf')} target="_blank" rel="noopener noreferrer">
                            <FileText className="size-4" />
                            Export PDF
                        </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <a href={buildExportUrl('xlsx')}>
                            <FileSpreadsheet className="size-4" />
                            Export Excel
                        </a>
                    </Button>
                </div>
            }
        >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total memberships</CardDescription>
                        <CardTitle className="text-3xl font-semibold tabular-nums">{stats.total}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Users className="size-4" />
                        Across all tenants
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Active memberships</CardDescription>
                        <CardTitle className="text-3xl font-semibold tabular-nums">{stats.active}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground flex items-center gap-2 text-sm">
                        <ShieldCheck className="size-4" />
                        Currently active access
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Organizations</CardDescription>
                        <CardTitle className="text-3xl font-semibold tabular-nums">{stats.organizations}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Building2 className="size-4" />
                        With at least one member
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Default memberships</CardDescription>
                        <CardTitle className="text-3xl font-semibold tabular-nums">{stats.default}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Star className="size-4" />
                        Marked as default org
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="gap-4 border-b pb-4">
                    <div className="flex flex-col gap-1">
                        <CardTitle>Membership directory</CardTitle>
                        <CardDescription>Filter by user, organization, or membership status.</CardDescription>
                    </div>
                    <form className="grid gap-3 lg:grid-cols-[1.4fr_12rem_12rem_auto]" onSubmit={applyFilters}>
                        <div className="relative">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                            <Input
                                value={filterForm.data.search}
                                onChange={(event) => filterForm.setData('search', event.target.value)}
                                placeholder="Search users, emails, or organizations..."
                                className="pl-9"
                            />
                        </div>
                        <Select
                            value={filterForm.data.status}
                            onValueChange={(value) => filterForm.setData('status', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_FILTER_VALUE}>All statuses</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="invited">Invited</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filterForm.data.organization_id}
                            onValueChange={(value) => filterForm.setData('organization_id', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Organization" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_FILTER_VALUE}>All organizations</SelectItem>
                                {organizationOptions.map((option) => (
                                    <SelectItem key={String(option.value)} value={String(option.value)}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                            <Button type="submit">Apply</Button>
                            <Button type="button" variant="outline" onClick={resetFilters}>
                                <RotateCcw className="size-4" />
                                Reset
                            </Button>
                        </div>
                    </form>
                </CardHeader>
                <CardContent className="pt-4">
                    {memberships.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
                            <UserRound className="text-muted-foreground size-10" />
                            <div>
                                <p className="font-medium">No memberships match your filters</p>
                                <p className="text-muted-foreground text-sm">Try clearing the filters or searching with a different term.</p>
                            </div>
                            <Button variant="outline" onClick={resetFilters}>
                                Clear filters
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Organization</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Access</TableHead>
                                            <TableHead>Activated</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {memberships.data.map((membership) => (
                                            <TableRow key={membership.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                                                            {getInitials(membership.user?.name ?? '?')}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate font-medium">{membership.user?.name ?? 'Unknown user'}</p>
                                                            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                                                                <Mail className="size-3 shrink-0" />
                                                                <span className="truncate">{membership.user?.email ?? 'No email'}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="min-w-0">
                                                        {membership.organization ? (
                                                            <Link
                                                                href={route('platform.organizations.show', membership.organization.id)}
                                                                className="font-medium hover:underline"
                                                            >
                                                                {membership.organization.name}
                                                            </Link>
                                                        ) : (
                                                            <span className="font-medium">Unknown organization</span>
                                                        )}
                                                        <p className="text-muted-foreground text-xs">{membership.organization?.slug ?? 'n/a'}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <Badge variant="outline" className="gap-1">
                                                            <ShieldCheck className="size-3" />
                                                            {membership.status}
                                                        </Badge>
                                                        {membership.organization?.status ? (
                                                            <Badge variant="secondary">{membership.organization.status}</Badge>
                                                        ) : null}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {membership.is_default ? (
                                                            <Badge variant="secondary" className="gap-1">
                                                                <Check className="size-3" />
                                                                Default
                                                            </Badge>
                                                        ) : null}
                                                        {membership.access_all_locations ? (
                                                            <Badge variant="secondary" className="gap-1">
                                                                <MapPin className="size-3" />
                                                                All locations
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">Scoped locations</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {membership.activated_at ? formatDateTime(membership.activated_at) : '—'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="mt-4">
                                <PaginationLinks paginated={memberships} />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
