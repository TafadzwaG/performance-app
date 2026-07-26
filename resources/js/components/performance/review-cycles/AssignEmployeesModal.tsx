import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Option, ReviewCycle } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import { Loader2, Search, Trash2, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reviewCycle: Pick<ReviewCycle, 'id' | 'name'> | null;
    employeeProfileOptions: Option[];
    templateOptions: Option[];
}

type AssignmentTab = 'available' | 'assigned';

interface EmployeeAssignmentOption extends Option {
    department?: string;
    job_title?: string;
    appraisal_id?: number;
    status?: string;
    can_remove?: boolean;
}

export default function AssignEmployeesModal({
    open,
    onOpenChange,
    reviewCycle,
    employeeProfileOptions,
    templateOptions,
}: Props) {
    const { data, setData, post, processing, reset } = useForm<{
        template_id: string;
        employee_profile_ids: number[];
    }>({
        template_id: '',
        employee_profile_ids: [],
    });

    const [activeTab, setActiveTab] = useState<AssignmentTab>('available');
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<EmployeeAssignmentOption[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [removeError, setRemoveError] = useState<string | null>(null);
    const [removingAppraisalId, setRemovingAppraisalId] = useState<number | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [counts, setCounts] = useState<{ available: number; assigned: number }>({
        available: employeeProfileOptions.length,
        assigned: 0,
    });

    useEffect(() => {
        if (open) {
            reset('template_id', 'employee_profile_ids');
            setActiveTab('available');
            setSearch('');
            setSearchResults([]);
            setSearchError(null);
            setRemoveError(null);
            setRefreshKey((value) => value + 1);
        }
    }, [open, reset]);

    useEffect(() => {
        if (!open || !reviewCycle) {
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            setSearchLoading(true);
            setSearchError(null);

            try {
                const url = new URL(
                    route('performance.review_cycles.assign.employee_options', reviewCycle.id),
                    window.location.origin,
                );

                url.searchParams.set('search', search.trim());
                url.searchParams.set('limit', '40');
                url.searchParams.set('scope', activeTab);

                const response = await fetch(url.toString(), {
                    method: 'GET',
                    signal: controller.signal,
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch employees.');
                }

                const payload = (await response.json()) as {
                    data?: EmployeeAssignmentOption[];
                    counts?: { available?: number; assigned?: number };
                };

                setSearchResults(Array.isArray(payload.data) ? payload.data : []);
                setCounts({
                    available: Number(payload.counts?.available ?? 0),
                    assigned: Number(payload.counts?.assigned ?? 0),
                });
            } catch (error) {
                if (controller.signal.aborted) {
                    return;
                }

                setSearchResults([]);
                setSearchError('Could not load employees. Please retry.');
            } finally {
                if (!controller.signal.aborted) {
                    setSearchLoading(false);
                }
            }
        }, 300);

        return () => {
            controller.abort();
            window.clearTimeout(timer);
        };
    }, [activeTab, open, refreshKey, reviewCycle, search]);

    const allEmployeeIds = useMemo(
        () => searchResults.map((option) => Number(option.value)),
        [searchResults],
    );

    const allSelected =
        allEmployeeIds.length > 0 &&
        allEmployeeIds.every((employeeId) => data.employee_profile_ids.includes(employeeId));

    const toggleEmployee = (employeeId: number, checked: boolean) => {
        if (checked) {
            if (!data.employee_profile_ids.includes(employeeId)) {
                setData('employee_profile_ids', [...data.employee_profile_ids, employeeId]);
            }
            return;
        }

        setData(
            'employee_profile_ids',
            data.employee_profile_ids.filter((existingId) => existingId !== employeeId),
        );
    };

    const toggleAll = (checked: boolean) => {
        if (checked) {
            setData('employee_profile_ids', Array.from(new Set([...data.employee_profile_ids, ...allEmployeeIds])));
            return;
        }

        setData(
            'employee_profile_ids',
            data.employee_profile_ids.filter((existingId) => !allEmployeeIds.includes(existingId)),
        );
    };

    const selectedEmployees = useMemo(() => {
        const known = new Map<string, Option>();

        for (const option of employeeProfileOptions) {
            known.set(String(option.value), option);
        }

        for (const option of searchResults) {
            known.set(String(option.value), option);
        }

        return data.employee_profile_ids
            .map((id) => known.get(String(id)))
            .filter((option): option is Option => option !== undefined);
    }, [data.employee_profile_ids, employeeProfileOptions, searchResults]);

    const submit = () => {
        if (!reviewCycle) {
            return;
        }

        post(route('performance.review_cycles.assign.store', reviewCycle.id), {
            preserveScroll: true,
            onSuccess: () => {
                setData('employee_profile_ids', []);
                setSearch('');
                setRefreshKey((value) => value + 1);
            },
        });
    };

    const removeAssignment = async (appraisalId: number) => {
        if (!reviewCycle) {
            return;
        }

        setRemovingAppraisalId(appraisalId);
        setRemoveError(null);

        try {
            const response = await fetch(
                route('performance.review_cycles.assign.destroy', {
                    review_cycle: reviewCycle.id,
                    appraisal: appraisalId,
                }),
                {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
            });

            if (!response.ok) {
                const payload = (await response.json().catch(() => null)) as
                    | { errors?: Record<string, string[]>; message?: string }
                    | null;
                const firstError = payload?.errors ? Object.values(payload.errors)[0]?.[0] : undefined;

                throw new Error(firstError || payload?.message || 'Failed to remove employee assignment.');
            }

            setRefreshKey((value) => value + 1);
        } catch (error) {
            setRemoveError(error instanceof Error ? error.message : 'Failed to remove employee assignment.');
        } finally {
            setRemovingAppraisalId(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Assign Employees
                    </DialogTitle>
                    <DialogDescription>
                        {reviewCycle
                            ? `Manually assign selected employees to ${reviewCycle.name} while the cycle is still in draft. To assign all eligible employees automatically, use Open & assign instead.`
                            : 'Manually assign selected employees while the cycle is still in draft.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 rounded-lg border p-1">
                        <Button
                            type="button"
                            variant={activeTab === 'available' ? 'default' : 'ghost'}
                            className="justify-between"
                            onClick={() => setActiveTab('available')}
                        >
                            <span>Available</span>
                            <Badge variant={activeTab === 'available' ? 'secondary' : 'outline'}>{counts.available}</Badge>
                        </Button>
                        <Button
                            type="button"
                            variant={activeTab === 'assigned' ? 'default' : 'ghost'}
                            className="justify-between"
                            onClick={() => setActiveTab('assigned')}
                        >
                            <span>Assigned</span>
                            <Badge variant={activeTab === 'assigned' ? 'secondary' : 'outline'}>{counts.assigned}</Badge>
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="assign-template-id">Appraisal Template</Label>
                        <Select value={data.template_id || undefined} onValueChange={(value) => setData('template_id', value)}>
                            <SelectTrigger id="assign-template-id" className="h-10">
                                <SelectValue placeholder="Select template" />
                            </SelectTrigger>
                            <SelectContent>
                                {templateOptions.map((template) => (
                                    <SelectItem key={template.value} value={String(template.value)}>
                                        {template.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3 rounded-lg border p-3">
                        <div className="space-y-2">
                            <Label htmlFor="assign-employees-search">Search employees</Label>
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="assign-employees-search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder={
                                        activeTab === 'available'
                                            ? 'Search unassigned employees...'
                                            : 'Search assigned employees...'
                                    }
                                    className="pl-9"
                                />
                                {searchLoading ? (
                                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                                ) : null}
                            </div>
                            {searchError ? <p className="text-xs text-destructive">{searchError}</p> : null}
                            {removeError ? <p className="text-xs text-destructive">{removeError}</p> : null}
                        </div>

                        {activeTab === 'available' ? (
                            <>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="assign-employees-select-all"
                                            checked={allSelected}
                                            onCheckedChange={(checked) => toggleAll(Boolean(checked))}
                                        />
                                        <Label htmlFor="assign-employees-select-all" className="cursor-pointer text-sm font-medium">
                                            Select all visible employees
                                        </Label>
                                    </div>

                                    <Badge variant="outline">{data.employee_profile_ids.length} selected</Badge>
                                </div>

                                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                                    {searchResults.map((employee) => {
                                        const employeeId = Number(employee.value);
                                        const isChecked = data.employee_profile_ids.includes(employeeId);
                                        const meta: string[] = [];

                                        if (typeof employee.department === 'string' && employee.department.length > 0) {
                                            meta.push(employee.department);
                                        }

                                        if (typeof employee.job_title === 'string' && employee.job_title.length > 0) {
                                            meta.push(employee.job_title);
                                        }

                                        return (
                                            <label
                                                key={employee.value}
                                                className="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 hover:bg-muted/40"
                                            >
                                                <Checkbox
                                                    checked={isChecked}
                                                    onCheckedChange={(checked) => toggleEmployee(employeeId, Boolean(checked))}
                                                    className="mt-0.5"
                                                />
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-foreground">{employee.label}</div>
                                                    {meta.length > 0 ? (
                                                        <div className="text-xs text-muted-foreground">{meta.join(' | ')}</div>
                                                    ) : null}
                                                </div>
                                            </label>
                                        );
                                    })}

                                    {!searchLoading && searchResults.length === 0 ? (
                                        <div className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                                            No unassigned employees matched your search.
                                        </div>
                                    ) : null}
                                </div>
                            </>
                        ) : (
                            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                                {searchResults.map((employee) => {
                                    const meta: string[] = [];

                                    if (typeof employee.department === 'string' && employee.department.length > 0) {
                                        meta.push(employee.department);
                                    }

                                    if (typeof employee.job_title === 'string' && employee.job_title.length > 0) {
                                        meta.push(employee.job_title);
                                    }

                                    return (
                                        <div key={`${employee.value}-${employee.appraisal_id ?? ''}`} className="rounded-md border px-3 py-2">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-foreground">{employee.label}</div>
                                                    {meta.length > 0 ? (
                                                        <div className="text-xs text-muted-foreground">{meta.join(' | ')}</div>
                                                    ) : null}
                                                    {employee.status ? (
                                                        <div className="mt-1 text-xs text-muted-foreground">
                                                            Status: {employee.status.replaceAll('_', ' ')}
                                                        </div>
                                                    ) : null}
                                                </div>

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="shrink-0"
                                                    disabled={
                                                        !employee.can_remove ||
                                                        !employee.appraisal_id ||
                                                        removingAppraisalId === employee.appraisal_id
                                                    }
                                                    onClick={() =>
                                                        employee.appraisal_id ? removeAssignment(employee.appraisal_id) : undefined
                                                    }
                                                >
                                                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                                    {employee.can_remove ? 'Remove' : 'Started'}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {!searchLoading && searchResults.length === 0 ? (
                                    <div className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                                        No assigned employees matched your search.
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>

                    {selectedEmployees.length > 0 ? (
                        <div className="space-y-2 rounded-lg border p-3">
                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Selected Employees
                            </div>
                            <div className="max-h-28 space-y-1 overflow-y-auto pr-1">
                                {selectedEmployees.map((employee) => (
                                    <div key={employee.value} className="text-sm text-foreground">
                                        {employee.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={
                            activeTab !== 'available' ||
                            processing ||
                            !reviewCycle ||
                            !data.template_id ||
                            data.employee_profile_ids.length === 0
                        }
                        onClick={submit}
                    >
                        Assign Selected Employees
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
