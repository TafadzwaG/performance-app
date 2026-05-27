import DeleteUserDialog from '@/components/access/users/delete-user-dialog';
import GeneratedCredentialsAlert from '@/components/access/users/GeneratedCredentialsAlert';
import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateTime } from '@/lib/date-utils';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { AccessUserRecord, Option, Paginated } from '@/types/performance';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { Activity, ArrowDown, ArrowUp, ArrowUpDown, Briefcase, CheckCheck, Download, Eye, FileSpreadsheet, FileText, Filter, LogIn, Pencil, RotateCcw, Search, ShieldCheck, SlidersHorizontal, Trash2, UserPlus, Users, X } from 'lucide-react';

const ALL_FILTER_VALUE = 'all';

const employeeLinkFilterOptions = [
    { value: 'linked', label: 'Linked to employee profile' },
    { value: 'unlinked', label: 'Not linked' },
] as const;

const directPermissionFilterOptions = [
    { value: 'yes', label: 'Has direct permissions' },
    { value: 'no', label: 'No direct permissions' },
] as const;

interface UserExportColumn {
    key: string;
    label: string;
    section: string;
    default: boolean;
    required: boolean;
}

interface Props {
    users?: Paginated<AccessUserRecord> | null;
    filters?: {
        search?: string;
        sort_by?: string;
        sort_dir?: 'asc' | 'desc';
        approval_status?: 'active' | 'pending';
        role_id?: number | null;
        department_id?: number | null;
        employee_link?: 'linked' | 'unlinked' | null;
        has_direct_permissions?: 'yes' | 'no' | null;
    } | null;
    counts?: { active?: number; pending?: number } | null;
    roleOptions?: Option[] | null;
    departmentOptions?: Option[] | null;
    exportColumns?: UserExportColumn[] | null;
}

function getInitials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

function permissionTone(count: number) {
    if (count >= 8) return 'bg-foreground';
    if (count >= 3) return 'bg-foreground/70';
    return 'bg-muted-foreground/50';
}

export default function UsersIndex({ users, filters, counts, roleOptions, departmentOptions, exportColumns }: Props) {
    const { auth, flash } = usePage<SharedData>().props;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Performance', href: '/performance/dashboard' },
        { title: 'Users', href: route('access.users.index') },
    ];
    const canCreateUsers = auth.permissions.includes('access.users.create');
    const canImportUsers = auth.permissions.includes('access.users.import');
    const canExportUsers = auth.permissions.includes('access.users.view');
    const canImpersonateUsers = auth.permissions.includes('access.users.impersonate');
    const canApproveUsers = auth.permissions.includes('access.users.approve');
    const canDeleteUsers = auth.permissions.includes('access.users.delete');
    const isImpersonating = auth.impersonation?.isImpersonating ?? false;
    const approvalStatus = filters?.approval_status === 'pending' ? 'pending' : 'active';
    const pendingCount = counts?.pending ?? 0;
    const activeCount = counts?.active ?? 0;
    const [pendingSelectionId, setPendingSelectionId] = useState<number | null>(null);
    const [approvalModalOpen, setApprovalModalOpen] = useState(false);
    const [approvalRoleIds, setApprovalRoleIds] = useState<number[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<AccessUserRecord | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const safeExportColumns = exportColumns ?? [];
    const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>(
        safeExportColumns.filter((column) => column.default || column.required).map((column) => column.key),
    );

    const safeUsers: Paginated<AccessUserRecord> = {
        data: users?.data ?? [],
        current_page: users?.current_page ?? 1,
        last_page: users?.last_page ?? 1,
        per_page: users?.per_page ?? 10,
        total: users?.total ?? 0,
        from: users?.from ?? null,
        to: users?.to ?? null,
        path: users?.path ?? route('access.users.index'),
        links: users?.links ?? [],
    };

    const searchForm = useForm({
        search: filters?.search ?? '',
        sort_by: filters?.sort_by ?? 'name',
        sort_dir: filters?.sort_dir ?? 'asc',
        approval_status: approvalStatus,
        role_id: filters?.role_id ? String(filters.role_id) : '',
        department_id: filters?.department_id ? String(filters.department_id) : '',
        employee_link: filters?.employee_link ?? '',
        has_direct_permissions: filters?.has_direct_permissions ?? '',
    });

    const safeRoleOptions = roleOptions ?? [];
    const safeDepartmentOptions = departmentOptions ?? [];
    const pendingSelection = useMemo(
        () => safeUsers.data.find((user) => user.id === pendingSelectionId) ?? null,
        [pendingSelectionId, safeUsers.data],
    );
    const canOpenActivateModal = approvalStatus === 'pending' && !!pendingSelection && canApproveUsers;
    const exportColumnsBySection = useMemo(() => {
        return safeExportColumns.reduce<Record<string, UserExportColumn[]>>((groups, column) => {
            groups[column.section] = groups[column.section] ?? [];
            groups[column.section].push(column);

            return groups;
        }, {});
    }, [safeExportColumns]);

    const activeFilterCount = useMemo(
        () =>
            [
                searchForm.data.search,
                searchForm.data.role_id,
                searchForm.data.department_id,
                searchForm.data.employee_link,
                searchForm.data.has_direct_permissions,
            ].filter(Boolean).length,
        [
            searchForm.data.search,
            searchForm.data.role_id,
            searchForm.data.department_id,
            searchForm.data.employee_link,
            searchForm.data.has_direct_permissions,
        ],
    );

    const buildFilterParams = (overrides: Record<string, string | undefined> = {}) => ({
        search: searchForm.data.search || undefined,
        sort_by: searchForm.data.sort_by,
        sort_dir: searchForm.data.sort_dir,
        approval_status: searchForm.data.approval_status,
        role_id: searchForm.data.role_id || undefined,
        department_id: searchForm.data.department_id || undefined,
        employee_link: searchForm.data.employee_link || undefined,
        has_direct_permissions: searchForm.data.has_direct_permissions || undefined,
        ...overrides,
    });

    const applyFilters = (overrides: Record<string, string | undefined> = {}) => {
        router.get(route('access.users.index'), buildFilterParams(overrides), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const clearFilter = (key: 'search' | 'role_id' | 'department_id' | 'employee_link' | 'has_direct_permissions') => {
        searchForm.setData(key, '');
        applyFilters({ [key]: undefined });
    };

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        searchForm.get(route('access.users.index'), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const usersOnPage = safeUsers.data.length;
    const totalMatchingUsers = safeUsers.total ?? usersOnPage;
    const linkedProfiles = safeUsers.data.filter((user) => user.employee_profile).length;
    const usersWithRoles = safeUsers.data.filter((user) => (user.roles?.length ?? 0) > 0).length;
    const totalDirectPermissions = safeUsers.data.reduce((sum, user) => sum + (user.permissions?.length ?? 0), 0);

    const applySort = (column: 'name' | 'email' | 'employee_number' | 'created_at') => {
        const nextDirection =
            searchForm.data.sort_by === column && searchForm.data.sort_dir === 'asc' ? 'desc' : 'asc';

        searchForm.setData('sort_by', column);
        searchForm.setData('sort_dir', nextDirection);

        router.get(route('access.users.index'), buildFilterParams({ sort_by: column, sort_dir: nextDirection }), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const SortIcon = ({ column }: { column: 'name' | 'email' | 'employee_number' | 'created_at' }) => {
        if (searchForm.data.sort_by !== column) {
            return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/70" />;
        }

        return searchForm.data.sort_dir === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5 text-foreground" />
        ) : (
            <ArrowDown className="h-3.5 w-3.5 text-foreground" />
        );
    };

    const startImpersonation = (user: AccessUserRecord) => {
        router.post(
            route('access.users.impersonate.store', { user: user.id }),
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const switchApprovalTab = (tab: 'active' | 'pending') => {
        searchForm.setData('approval_status', tab);

        router.get(route('access.users.index'), buildFilterParams({ approval_status: tab }), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        searchForm.setData({
            search: '',
            sort_by: 'name',
            sort_dir: 'asc',
            approval_status: approvalStatus,
            role_id: '',
            department_id: '',
            employee_link: '',
            has_direct_permissions: '',
        });

        router.get(route('access.users.index'), { approval_status: approvalStatus }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const openActivationModal = () => {
        if (!pendingSelection) return;

        const selectedRoles = pendingSelection.roles?.map((role) => role.id) ?? [];
        setApprovalRoleIds(selectedRoles);
        setApprovalModalOpen(true);
    };

    const toggleApprovalRole = (roleId: number) => {
        setApprovalRoleIds((current) =>
            current.includes(roleId)
                ? current.filter((id) => id !== roleId)
                : [...current, roleId],
        );
    };

    const approvePendingUser = () => {
        if (!pendingSelection || approvalRoleIds.length === 0) return;

        router.post(
            route('access.users.approve', { user: pendingSelection.id }),
            { role_ids: approvalRoleIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setApprovalModalOpen(false);
                    setPendingSelectionId(null);
                    setApprovalRoleIds([]);
                },
            },
        );
    };

    const toggleExportColumn = (column: UserExportColumn, checked: boolean) => {
        if (column.required) return;

        setSelectedExportColumns((current) => {
            if (checked) {
                return [...new Set([...current, column.key])];
            }

            return current.filter((key) => key !== column.key);
        });
    };

    const handleExport = (format: 'xlsx' | 'pdf') => {
        const url = new URL(route('access.users.export'), window.location.origin);
        const params = buildFilterParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                url.searchParams.set(key, value);
            }
        });

        url.searchParams.set('format', format);

        selectedExportColumns.forEach((column) => {
            url.searchParams.append('columns[]', column);
        });

        window.location.assign(url.toString());
        setExportModalOpen(false);
    };

    return (
        <PerformancePage
            title="Users"
            description="Manage account details, roles, and direct permissions."
            breadcrumbs={breadcrumbs}
        >
            <div className="space-y-6">
                <GeneratedCredentialsAlert credentials={flash.generatedCredentials} />

                <Card>
                    <CardHeader className="gap-4">
                        <div className="inline-flex w-fit items-center gap-2 rounded-md border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            User Directory
                        </div>

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-3xl font-semibold tracking-tight">Users</CardTitle>
                                <CardDescription>
                                    Manage account details, employee links, assigned roles, and direct permissions.
                                </CardDescription>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button asChild type="button" variant="outline">
                                    <Link href={route('access.users.mfa.index')}>
                                        <ShieldCheck className="mr-2 h-4 w-4" />
                                        MFA Settings
                                    </Link>
                                </Button>

                                {canExportUsers ? (
                                    <Button type="button" variant="outline" onClick={() => setExportModalOpen(true)}>
                                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                                        Export Users
                                    </Button>
                                ) : null}

                                {canImportUsers ? (
                                    <Button asChild type="button" variant="info">
                                        <Link href={route('access.users.import.create')}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Import Users
                                        </Link>
                                    </Button>
                                ) : null}

                                {canCreateUsers ? (
                                    <>
                                        <Button asChild type="button" variant="soft">
                                            <Link href={route('access.users.bulk_create')}>
                                                <Users className="mr-2 h-4 w-4" />
                                                Add Multiple
                                            </Link>
                                        </Button>
                                        <Button asChild type="button" variant="default">
                                            <Link href={route('access.users.create')}>
                                                <UserPlus className="mr-2 h-4 w-4" />
                                                Create User
                                            </Link>
                                        </Button>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <Card>
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                type="button"
                                variant={approvalStatus === 'active' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => switchApprovalTab('active')}
                            >
                                Active Users
                                <Badge className="ml-2" variant="outline">
                                    {activeCount}
                                </Badge>
                            </Button>
                            <Button
                                type="button"
                                variant={approvalStatus === 'pending' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => switchApprovalTab('pending')}
                            >
                                Pending Approvals
                                <Badge className="ml-2" variant="outline">
                                    {pendingCount}
                                </Badge>
                            </Button>
                        </div>

                        {approvalStatus === 'pending' && canApproveUsers ? (
                            <Button
                                type="button"
                                variant="success"
                                size="sm"
                                onClick={openActivationModal}
                                disabled={!canOpenActivateModal}
                            >
                                <CheckCheck className="mr-2 h-4 w-4" />
                                Activate Selected
                            </Button>
                        ) : null}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="border-b bg-muted/20">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                    Search & Filter
                                </CardDescription>
                                <CardTitle className="text-lg">Find users</CardTitle>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <SlidersHorizontal className="h-4 w-4" />
                                <span>
                                    {activeFilterCount} active filter{activeFilterCount === 1 ? '' : 's'}
                                </span>
                                <Badge variant="outline">{totalMatchingUsers} matching</Badge>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-6">
                        <form onSubmit={submitSearch} className="space-y-4">
                            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                                <div className="space-y-2 xl:col-span-2">
                                    <label className="block text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                        Search
                                    </label>
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={searchForm.data.search}
                                            onChange={(event) => searchForm.setData('search', event.target.value)}
                                            placeholder="Name, email, or employee number"
                                            className="h-11 pl-10"
                                        />
                                    </div>
                                </div>

                                <FilterSelect
                                    label="Role"
                                    placeholder="All roles"
                                    value={searchForm.data.role_id}
                                    options={safeRoleOptions.map((role) => ({
                                        value: String(role.value),
                                        label: role.label,
                                    }))}
                                    onValueChange={(value) => searchForm.setData('role_id', value)}
                                />

                                <FilterSelect
                                    label="Department"
                                    placeholder="All departments"
                                    value={searchForm.data.department_id}
                                    options={safeDepartmentOptions.map((department) => ({
                                        value: String(department.value),
                                        label: department.label,
                                    }))}
                                    onValueChange={(value) => searchForm.setData('department_id', value)}
                                />

                                <FilterSelect
                                    label="Employee Profile"
                                    placeholder="All profile states"
                                    value={searchForm.data.employee_link}
                                    options={[...employeeLinkFilterOptions]}
                                    onValueChange={(value) => searchForm.setData('employee_link', value)}
                                />

                                <FilterSelect
                                    label="Direct Permissions"
                                    placeholder="All permission states"
                                    value={searchForm.data.has_direct_permissions}
                                    options={[...directPermissionFilterOptions]}
                                    onValueChange={(value) => searchForm.setData('has_direct_permissions', value)}
                                />
                            </div>

                            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-wrap gap-2">
                                    {searchForm.data.search ? (
                                        <Badge variant="secondary" className="gap-1">
                                            Search: {searchForm.data.search}
                                            <button
                                                type="button"
                                                onClick={() => clearFilter('search')}
                                                className="rounded-sm hover:text-foreground"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ) : null}
                                    {searchForm.data.role_id ? (
                                        <Badge variant="secondary" className="gap-1">
                                            Role: {safeRoleOptions.find((role) => String(role.value) === searchForm.data.role_id)?.label}
                                            <button
                                                type="button"
                                                onClick={() => clearFilter('role_id')}
                                                className="rounded-sm hover:text-foreground"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ) : null}
                                    {searchForm.data.department_id ? (
                                        <Badge variant="secondary" className="gap-1">
                                            Department:{' '}
                                            {
                                                safeDepartmentOptions.find(
                                                    (department) => String(department.value) === searchForm.data.department_id,
                                                )?.label
                                            }
                                            <button
                                                type="button"
                                                onClick={() => clearFilter('department_id')}
                                                className="rounded-sm hover:text-foreground"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ) : null}
                                    {searchForm.data.employee_link ? (
                                        <Badge variant="secondary" className="gap-1">
                                            Profile: {searchForm.data.employee_link === 'linked' ? 'Linked' : 'Not linked'}
                                            <button
                                                type="button"
                                                onClick={() => clearFilter('employee_link')}
                                                className="rounded-sm hover:text-foreground"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ) : null}
                                    {searchForm.data.has_direct_permissions ? (
                                        <Badge variant="secondary" className="gap-1">
                                            Permissions: {searchForm.data.has_direct_permissions === 'yes' ? 'Has direct' : 'None'}
                                            <button
                                                type="button"
                                                onClick={() => clearFilter('has_direct_permissions')}
                                                className="rounded-sm hover:text-foreground"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ) : null}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button type="submit" variant="info" disabled={searchForm.processing}>
                                        <Filter className="mr-2 h-4 w-4" />
                                        Apply Filters
                                    </Button>

                                    <Button type="button" variant="outline" onClick={resetFilters}>
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        Reset
                                    </Button>

                                    {canExportUsers ? (
                                        <Button type="button" variant="outline" onClick={() => setExportModalOpen(true)}>
                                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                                            Export
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="border-b bg-muted/40">
                                    <tr>
                                        {approvalStatus === 'pending' ? (
                                            <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                                Select
                                            </th>
                                        ) : null}
                                        <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                            <button
                                                type="button"
                                                onClick={() => applySort('name')}
                                                className="inline-flex items-center gap-1 hover:text-foreground"
                                            >
                                                User
                                                <SortIcon column="name" />
                                            </button>
                                        </th>
                                        <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                            <button
                                                type="button"
                                                onClick={() => applySort('employee_number')}
                                                className="inline-flex items-center gap-1 hover:text-foreground"
                                            >
                                                Employee Profile
                                                <SortIcon column="employee_number" />
                                            </button>
                                        </th>
                                        <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                            Roles
                                        </th>
                                        <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                            Direct Permissions
                                        </th>
                                        <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                            MFA
                                        </th>
                                        <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                            <button
                                                type="button"
                                                onClick={() => applySort('created_at')}
                                                className="inline-flex items-center gap-1 hover:text-foreground"
                                            >
                                                Created
                                                <SortIcon column="created_at" />
                                            </button>
                                        </th>
                                        <th className="px-6 py-4 text-right text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {safeUsers.data.length > 0 ? (
                                        safeUsers.data.map((user) => (
                                            <tr key={user.id} className="border-t transition-colors hover:bg-muted/40">
                                                {approvalStatus === 'pending' ? (
                                                    <td className="px-6 py-5">
                                                        <Checkbox
                                                            checked={pendingSelectionId === user.id}
                                                            onCheckedChange={(checked) => {
                                                                setPendingSelectionId(checked === true ? user.id : null);
                                                            }}
                                                        />
                                                    </td>
                                                ) : null}
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-full border bg-muted font-medium text-foreground">
                                                            {getInitials(user.name)}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <div className="truncate font-medium text-foreground">{user.name}</div>
                                                            <div className="truncate text-xs text-muted-foreground">
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-1">
                                                        <Badge variant={user.is_approved ? 'secondary' : 'outline'}>
                                                            {user.is_approved ? 'active' : 'pending'}
                                                        </Badge>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5 text-foreground">
                                                    {user.employee_profile?.employee_number ?? 'Not linked'}
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="flex flex-wrap gap-2">
                                                        {user.roles && user.roles.length > 0 ? (
                                                            user.roles.map((role) => (
                                                                <Badge key={role.id} variant="secondary">
                                                                    {role.name}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">None assigned</span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className={`h-2.5 w-2.5 rounded-full ${permissionTone(
                                                                user.permissions?.length ?? 0,
                                                            )}`}
                                                        />
                                                        <span className="font-medium text-foreground">
                                                            {user.permissions?.length ?? 0} active
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <Badge variant={user.email_mfa_enabled ? 'secondary' : 'outline'}>
                                                        {user.email_mfa_enabled ? 'Enabled' : 'Disabled'}
                                                    </Badge>
                                                </td>

                                                <td className="px-6 py-5 text-sm text-foreground">
                                                    {formatDateTime(user.created_at)}
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="flex justify-end gap-2">
                                                        <Button asChild variant="info" size="icon" title={`View ${user.name}`}>
                                                            <Link href={route('access.users.show', { user: user.id })}>
                                                                <Eye className="h-4 w-4" />
                                                                <span className="sr-only">View {user.name}</span>
                                                            </Link>
                                                        </Button>

                                                        <Button asChild variant="warning" size="icon" title={`Edit ${user.name}`}>
                                                            <Link href={route('access.users.edit', { user: user.id })}>
                                                                <Pencil className="h-4 w-4" />
                                                                <span className="sr-only">Edit {user.name}</span>
                                                            </Link>
                                                        </Button>

                                                        {canImpersonateUsers && approvalStatus === 'active' && !isImpersonating && auth.user.id !== user.id && (
                                                            <Button
                                                                type="button"
                                                                variant="accent"
                                                                size="sm"
                                                                title={`Impersonate ${user.name}`}
                                                                onClick={() => startImpersonation(user)}
                                                            >
                                                                <LogIn className="mr-2 h-4 w-4" />
                                                                Impersonate
                                                            </Button>
                                                        )}

                                                        {canDeleteUsers && auth.user.id !== user.id && (
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="icon"
                                                                title={`Delete ${user.name}`}
                                                                onClick={() => {
                                                                    setDeleteTarget(user);
                                                                    setDeleteDialogOpen(true);
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                <span className="sr-only">Delete {user.name}</span>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={approvalStatus === 'pending' ? 8 : 7} className="px-6 py-14 text-center">
                                                <div className="mx-auto max-w-md space-y-2">
                                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-muted text-muted-foreground">
                                                        <Users className="h-5 w-5" />
                                                    </div>
                                                    <h3 className="text-base font-semibold text-foreground">No users found</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {approvalStatus === 'pending'
                                                            ? 'No users are currently pending approval.'
                                                            : 'Try adjusting your search to find matching user records.'}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {safeUsers.links.length > 0 && (
                            <div className="flex flex-col gap-4 border-t px-6 py-4 md:flex-row md:items-center md:justify-between">
                                <div className="text-xs text-muted-foreground">
                                    Showing {safeUsers.from ?? 0} to {safeUsers.to ?? usersOnPage} of{' '}
                                    <span className="font-medium text-foreground">{totalMatchingUsers}</span> matching users
                                </div>

                                <PaginationLinks paginated={safeUsers} />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 text-foreground">
                                <ShieldCheck className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm">Directory Coverage</CardTitle>
                            </div>
                            <CardDescription>Employee profile linkage across visible users.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold text-foreground">{linkedProfiles}</div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Users linked to employee profiles on this page.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 text-foreground">
                                        <Activity className="h-4.5 w-4.5" />
                                        <CardTitle className="text-sm">Access Snapshot</CardTitle>
                                    </div>
                                    <CardDescription className="mt-1">
                                        Quick overview of role coverage and direct permission assignments.
                                    </CardDescription>
                                </div>

                                <Button variant="link" className="h-auto p-0 text-foreground">
                                    View Directory Insights
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-xl border bg-muted/30 p-4">
                                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    Users With Roles
                                </div>
                                <div className="text-xl font-semibold text-foreground">{usersWithRoles}</div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Accounts with at least one assigned role.
                                </p>
                            </div>

                            <div className="rounded-xl border bg-muted/30 p-4">
                                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <Briefcase className="h-4 w-4" />
                                    Direct Permissions
                                </div>
                                <div className="text-xl font-semibold text-foreground">{totalDirectPermissions}</div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Direct permissions across visible users.
                                </p>
                            </div>

                            <div className="rounded-xl border bg-muted/30 p-4">
                                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <Activity className="h-4 w-4" />
                                    Directory Status
                                </div>
                                <div className="text-xl font-semibold text-foreground">Active</div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    User directory loaded and ready for review.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <DeleteUserDialog user={deleteTarget} open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} />

            <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                            § Export
                        </div>
                        <DialogTitle className="font-display flex items-center gap-2 text-2xl font-light tracking-tight">
                            <FileSpreadsheet className="h-5 w-5" />
                            IT User Access List
                        </DialogTitle>
                        <DialogDescription className="text-[13px]">
                            Download the IT User Access List with your selected columns. The export respects your current search, filters, approval tab, and sort order.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[55vh] space-y-5 overflow-y-auto pr-1">
                        {Object.entries(exportColumnsBySection).map(([section, columns]) => (
                            <section key={section} className="space-y-3">
                                <h3 className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                    {labelize(section)}
                                </h3>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    {columns.map((column) => {
                                        const checked = selectedExportColumns.includes(column.key);

                                        return (
                                            <label
                                                key={column.key}
                                                className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2 text-sm"
                                            >
                                                <Checkbox
                                                    checked={checked}
                                                    disabled={column.required}
                                                    onCheckedChange={(value) => toggleExportColumn(column, value === true)}
                                                />
                                                <span className="flex-1 font-medium text-foreground">{column.label}</span>
                                                {column.required ? <Badge variant="outline">Required</Badge> : null}
                                            </label>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}
                    </div>

                    <DialogFooter className="gap-2 sm:justify-between">
                        <Button type="button" variant="outline" onClick={() => setExportModalOpen(false)}>
                            Cancel
                        </Button>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleExport('xlsx')}
                                disabled={selectedExportColumns.length === 0}
                            >
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Download Excel
                            </Button>
                            <Button
                                type="button"
                                onClick={() => handleExport('pdf')}
                                disabled={selectedExportColumns.length === 0}
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                Download PDF
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Activate User Account</DialogTitle>
                        <DialogDescription>
                            {pendingSelection
                                ? `Assign role(s) and activate ${pendingSelection.name} (${pendingSelection.email}).`
                                : 'Assign roles and activate the selected user.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Assign Roles</div>
                        <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
                            {safeRoleOptions.map((role) => {
                                const roleId = Number(role.value);
                                const checked = approvalRoleIds.includes(roleId);
                                const inputId = `approve-role-${roleId}`;

                                return (
                                    <label
                                        key={roleId}
                                        htmlFor={inputId}
                                        className="flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 hover:bg-muted/30"
                                    >
                                        <span className="text-sm text-foreground">{role.label}</span>
                                        <Checkbox
                                            id={inputId}
                                            checked={checked}
                                            onCheckedChange={() => toggleApprovalRole(roleId)}
                                        />
                                    </label>
                                );
                            })}
                        </div>
                        {approvalRoleIds.length === 0 ? (
                            <p className="text-xs text-destructive">Select at least one role before activation.</p>
                        ) : null}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setApprovalModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="success" onClick={approvePendingUser} disabled={approvalRoleIds.length === 0}>
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Activate User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PerformancePage>
    );
}

function labelize(value: string) {
    return value.replace(/[_-]/g, ' ');
}

function FilterSelect({
    label,
    placeholder,
    value,
    options,
    onValueChange,
}: {
    label: string;
    placeholder: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    onValueChange: (value: string) => void;
}) {
    return (
        <div className="space-y-2">
            <label className="block text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</label>
            <Select
                value={value || ALL_FILTER_VALUE}
                onValueChange={(next) => onValueChange(next === ALL_FILTER_VALUE ? '' : next)}
            >
                <SelectTrigger className="h-11">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_FILTER_VALUE}>{placeholder}</SelectItem>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
