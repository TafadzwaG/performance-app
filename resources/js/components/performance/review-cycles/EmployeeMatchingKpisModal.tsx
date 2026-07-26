import MatchingKpiForm, { createEmptyKpiFormValues, type MatchingKpiFormValues } from '@/components/performance/review-cycles/MatchingKpiForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';
import type { AutomationReadinessMatchingKpi, Option, ReviewCycleAutomationReadiness } from '@/types/performance';
import { router, usePage } from '@inertiajs/react';
import { AlertTriangle, Briefcase, Loader2, PencilLine, Plus, Save, Target, Trash2, Wand2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type Blocker = ReviewCycleAutomationReadiness['blockers'][number];

interface EditableKpi extends AutomationReadinessMatchingKpi {
    original_weight: number;
}

interface Props {
    blocker: Blocker | null;
    open: boolean;
    perspectiveOptions: Option[];
    templateLimits?: ReviewCycleAutomationReadiness['template'];
    onOpenChange: (open: boolean) => void;
}

type FormMode = 'hidden' | 'create' | 'edit';

function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

function roundWeight(value: number) {
    return Math.round(value * 100) / 100;
}

function buildEditableRows(kpis: AutomationReadinessMatchingKpi[]): EditableKpi[] {
    return kpis.map((kpi) => ({
        ...kpi,
        original_weight: kpi.default_weight,
    }));
}

function distributeWeightsEvenly(rows: EditableKpi[]): EditableKpi[] {
    if (rows.length === 0) {
        return rows;
    }

    const base = roundWeight(100 / rows.length);
    let allocated = 0;

    return rows.map((row, index) => {
        if (index === rows.length - 1) {
            return { ...row, default_weight: roundWeight(100 - allocated) };
        }

        allocated += base;

        return { ...row, default_weight: base };
    });
}

function kpiToFormValues(kpi: AutomationReadinessMatchingKpi): MatchingKpiFormValues {
    return {
        perspective_id: kpi.perspective_id ? String(kpi.perspective_id) : '',
        title: kpi.title,
        kpi_measure: kpi.kpi_measure ?? '',
        default_weight: kpi.default_weight,
        description: kpi.description ?? '',
    };
}

async function readApiError(response: Response, fallback: string) {
    const payload = (await response.json().catch(() => null)) as
        | { message?: string; errors?: Record<string, string[]> }
        | null;
    const firstValidation = payload?.errors ? Object.values(payload.errors)[0]?.[0] : undefined;

    return firstValidation || payload?.message || fallback;
}

export default function EmployeeMatchingKpisModal({
    blocker,
    open,
    perspectiveOptions,
    templateLimits = null,
    onOpenChange,
}: Props) {
    const { auth, tenant } = usePage<SharedData>().props;
    const permissionSet = new Set(auth.permissions ?? []);
    const isSuperAdmin = (auth.roles ?? []).some((role) => role.toLowerCase() === 'super admin');
    const isPlatformSupportAccess = Boolean(auth.user?.is_platform_admin) && Boolean(tenant?.supportAccess);
    const hasPermission = (...names: string[]) =>
        isSuperAdmin || isPlatformSupportAccess || names.some((name) => permissionSet.has(name));
    const canCreateKpis = hasPermission('performance.goal_library.create');
    const canEditKpis = hasPermission('performance.goal_library.update');
    const canRemoveKpis = hasPermission('performance.goal_library.archive');

    const [rows, setRows] = useState<EditableKpi[]>([]);
    const [formMode, setFormMode] = useState<FormMode>('hidden');
    const [editingKpiId, setEditingKpiId] = useState<number | null>(null);
    const [formValues, setFormValues] = useState<MatchingKpiFormValues>(createEmptyKpiFormValues());
    const [saving, setSaving] = useState(false);
    const [savingForm, setSavingForm] = useState(false);
    const [removingId, setRemovingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && blocker) {
            const nextRows = buildEditableRows(blocker.matching_kpis ?? []);
            setRows(nextRows);
            setError(null);
            setEditingKpiId(null);
            setFormMode(nextRows.length === 0 && canCreateKpis ? 'create' : 'hidden');
            setFormValues(createEmptyKpiFormValues());
        }
    }, [blocker, canCreateKpis, open]);

    const weightTotal = useMemo(() => roundWeight(rows.reduce((sum, row) => sum + Number(row.default_weight || 0), 0)), [rows]);
    const weightsValid = weightTotal === 100;
    const minKpis = templateLimits?.min_objectives ?? null;
    const maxKpis = templateLimits?.max_objectives ?? null;
    const kpiCount = rows.length;
    const belowMinKpis = minKpis !== null && kpiCount < minKpis;
    const aboveMaxKpis = maxKpis !== null && kpiCount > maxKpis;
    const kpiCountValid = !belowMinKpis && !aboveMaxKpis;
    const atMaxKpis = maxKpis !== null && kpiCount >= maxKpis;
    const missingKpiCount = minKpis !== null ? Math.max(0, minKpis - kpiCount) : 0;
    const dirtyRows = rows.filter((row) => row.default_weight !== row.original_weight);
    const hasWeightChanges = dirtyRows.length > 0;
    const canManageInModal = canCreateKpis || canEditKpis || canRemoveKpis;
    const missingScope = !blocker?.department_id || !blocker?.job_title_id;

    const refreshReadiness = () => {
        router.reload({
            only: ['automationReadiness'],
            preserveScroll: true,
            preserveState: true,
        });
    };

    const updateRowWeight = (id: number, value: string) => {
        const parsed = value === '' ? 0 : Number(value);
        setRows((current) =>
            current.map((row) => (row.id === id ? { ...row, default_weight: Number.isFinite(parsed) ? parsed : 0 } : row)),
        );
    };

    const saveWeights = async () => {
        if (!canEditKpis || dirtyRows.length === 0) {
            return;
        }

        setSaving(true);
        setError(null);

        try {
            for (const row of dirtyRows) {
                const response = await fetch(route('performance.goal_library.update_weight', row.id), {
                    method: 'PATCH',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                    body: JSON.stringify({ default_weight: row.default_weight }),
                });

                if (!response.ok) {
                    throw new Error(await readApiError(response, 'Failed to save KPI weights.'));
                }
            }

            refreshReadiness();
            setRows((current) => current.map((row) => ({ ...row, original_weight: row.default_weight })));
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Failed to save KPI weights.');
        } finally {
            setSaving(false);
        }
    };

    const removeKpi = async (kpiId: number) => {
        if (!canRemoveKpis) {
            return;
        }

        if (!window.confirm('Remove this KPI from the active goal library for this department and job title?')) {
            return;
        }

        setRemovingId(kpiId);
        setError(null);

        try {
            const response = await fetch(route('performance.goal_library.deactivate', kpiId), {
                method: 'PATCH',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
            });

            if (!response.ok) {
                throw new Error(await readApiError(response, 'Failed to remove KPI.'));
            }

            if (editingKpiId === kpiId) {
                setFormMode(rows.length <= 1 && canCreateKpis ? 'create' : 'hidden');
                setEditingKpiId(null);
            }

            setRows((current) => current.filter((row) => row.id !== kpiId));
            refreshReadiness();
        } catch (removeError) {
            setError(removeError instanceof Error ? removeError.message : 'Failed to remove KPI.');
        } finally {
            setRemovingId(null);
        }
    };

    const openCreateForm = () => {
        if (atMaxKpis) {
            setError(`This template allows no more than ${maxKpis} KPIs.`);
            return;
        }

        setEditingKpiId(null);
        setFormMode('create');
        setFormValues(createEmptyKpiFormValues());
        setError(null);
    };

    const openEditForm = (kpi: EditableKpi) => {
        setEditingKpiId(kpi.id);
        setFormMode('edit');
        setFormValues(kpiToFormValues(kpi));
        setError(null);
    };

    const handleCancelForm = () => {
        setEditingKpiId(null);
        setFormMode(rows.length === 0 && canCreateKpis ? 'create' : 'hidden');
        setFormValues(createEmptyKpiFormValues());
    };

    const submitKpiForm = async (values: MatchingKpiFormValues) => {
        if (missingScope) {
            setError('This employee is missing a department or job title, so KPIs cannot be managed here.');
            return;
        }

        setSavingForm(true);
        setError(null);

        try {
            if (formMode === 'create') {
                if (!canCreateKpis) {
                    return;
                }

                if (atMaxKpis) {
                    throw new Error(`This template allows no more than ${maxKpis} KPIs.`);
                }

                const response = await fetch(route('performance.goal_library.store'), {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                    body: JSON.stringify({
                        department_id: blocker?.department_id,
                        job_title_id: blocker?.job_title_id,
                        perspective_id: Number(values.perspective_id),
                        title: values.title,
                        description: values.description || null,
                        kpi_measure: values.kpi_measure || null,
                        default_weight: values.default_weight,
                        is_active: true,
                    }),
                });

                if (!response.ok) {
                    throw new Error(await readApiError(response, 'Failed to create KPI.'));
                }
            } else if (formMode === 'edit' && editingKpiId) {
                if (!canEditKpis) {
                    return;
                }

                const response = await fetch(route('performance.goal_library.quick_update', editingKpiId), {
                    method: 'PATCH',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                    body: JSON.stringify({
                        perspective_id: Number(values.perspective_id),
                        title: values.title,
                        description: values.description || null,
                        kpi_measure: values.kpi_measure || null,
                        default_weight: values.default_weight,
                    }),
                });

                if (!response.ok) {
                    throw new Error(await readApiError(response, 'Failed to update KPI.'));
                }
            }

            setFormMode('hidden');
            setEditingKpiId(null);
            refreshReadiness();
        } catch (formError) {
            setError(formError instanceof Error ? formError.message : 'Failed to save KPI.');
        } finally {
            setSavingForm(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] w-full max-w-6xl overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Target className="size-5 text-amber-600" />
                        Manage matching KPIs
                    </DialogTitle>
                    <DialogDescription>
                        {blocker ? (
                            <>
                                Add, edit, and balance KPIs for <span className="text-foreground font-medium">{blocker.employee_name}</span>
                                {blocker.employee_number ? ` (#${blocker.employee_number})` : ''} without leaving this review cycle.
                            </>
                        ) : (
                            'Manage the KPIs that apply to this employee.'
                        )}
                    </DialogDescription>
                </DialogHeader>

                {blocker ? (
                    <div className="space-y-4 overflow-y-auto pr-1">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap gap-2">
                                {blocker.department_name ? (
                                    <Badge variant="outline" className="gap-1.5 font-normal">
                                        <Briefcase className="size-3.5" />
                                        {blocker.department_name}
                                    </Badge>
                                ) : null}
                                {blocker.job_title_name ? (
                                    <Badge variant="outline" className="gap-1.5 font-normal">
                                        {blocker.job_title_name}
                                    </Badge>
                                ) : null}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {canEditKpis && rows.length > 0 ? (
                                    <Button type="button" variant="outline" size="sm" onClick={() => setRows((current) => distributeWeightsEvenly(current))}>
                                        <Wand2 className="size-4" />
                                        Distribute evenly
                                    </Button>
                                ) : null}
                                {canCreateKpis && formMode !== 'create' ? (
                                    <Button type="button" size="sm" onClick={openCreateForm} disabled={missingScope || atMaxKpis}>
                                        <Plus className="size-4" />
                                        Add KPI
                                    </Button>
                                ) : null}
                            </div>
                        </div>

                        {missingScope ? (
                            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100">
                                Assign a department and job title on the employee profile before KPIs can be managed here.
                            </div>
                        ) : null}

                        {templateLimits && minKpis !== null && maxKpis !== null ? (
                            <div
                                className={cn(
                                    'rounded-xl border px-4 py-3 text-sm',
                                    kpiCountValid
                                        ? 'border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-100'
                                        : 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100',
                                )}
                            >
                                <p className="font-medium">
                                    Template requires {minKpis}–{maxKpis} KPIs
                                    {templateLimits.name ? ` (${templateLimits.name})` : ''}
                                </p>
                                <p className="mt-1">
                                    {belowMinKpis
                                        ? `Add ${missingKpiCount} more KPI${missingKpiCount === 1 ? '' : 's'} to meet the minimum before this cycle can open.`
                                        : aboveMaxKpis
                                          ? `Remove ${kpiCount - maxKpis} KPI${kpiCount - maxKpis === 1 ? '' : 's'} to stay within the template maximum.`
                                          : 'KPI count meets the template requirement.'}
                                </p>
                            </div>
                        ) : null}

                        {error ? <p className="text-destructive text-sm">{error}</p> : null}

                        {formMode !== 'hidden' && canManageInModal && !missingScope ? (
                            <MatchingKpiForm
                                mode={formMode}
                                initialValues={formValues}
                                perspectiveOptions={perspectiveOptions}
                                saving={savingForm}
                                onSubmit={submitKpiForm}
                                onCancel={handleCancelForm}
                            />
                        ) : null}

                        {rows.length === 0 && formMode === 'hidden' ? (
                            <div className="rounded-xl border border-dashed p-6 text-center">
                                <AlertTriangle className="text-muted-foreground mx-auto size-8" />
                                <p className="mt-3 font-medium">No matching KPIs found</p>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    {canCreateKpis
                                        ? 'Use Add KPI to create the first KPI for this role.'
                                        : 'You do not have permission to create KPIs from here.'}
                                </p>
                            </div>
                        ) : rows.length > 0 ? (
                            <div className="overflow-hidden rounded-xl border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Perspective</TableHead>
                                            <TableHead>KPI</TableHead>
                                            <TableHead>Measure</TableHead>
                                            <TableHead className="text-right">Weight (%)</TableHead>
                                            {canEditKpis || canRemoveKpis ? (
                                                <TableHead className="w-[96px] text-right">Actions</TableHead>
                                            ) : null}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.map((kpi) => (
                                            <TableRow key={kpi.id} className={editingKpiId === kpi.id ? 'bg-muted/30' : undefined}>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {kpi.perspective_name ?? '—'}
                                                </TableCell>
                                                <TableCell className="font-medium">{kpi.title}</TableCell>
                                                <TableCell className="text-muted-foreground max-w-[220px] text-sm">
                                                    {kpi.kpi_measure ?? '—'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {canEditKpis ? (
                                                        <Input
                                                            type="number"
                                                            min="0.01"
                                                            max="100"
                                                            step="0.01"
                                                            value={kpi.default_weight}
                                                            onChange={(event) => updateRowWeight(kpi.id, event.target.value)}
                                                            className="ml-auto h-8 w-24 text-right tabular-nums"
                                                        />
                                                    ) : (
                                                        <span className="font-medium tabular-nums">{kpi.default_weight.toFixed(2)}%</span>
                                                    )}
                                                </TableCell>
                                                {canEditKpis || canRemoveKpis ? (
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            {canEditKpis ? (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    disabled={saving || savingForm || removingId !== null}
                                                                    onClick={() => openEditForm(kpi)}
                                                                >
                                                                    <PencilLine className="size-4" />
                                                                </Button>
                                                            ) : null}
                                                            {canRemoveKpis ? (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-destructive hover:text-destructive"
                                                                    disabled={removingId === kpi.id || saving || savingForm}
                                                                    onClick={() => removeKpi(kpi.id)}
                                                                >
                                                                    {removingId === kpi.id ? (
                                                                        <Loader2 className="size-4 animate-spin" />
                                                                    ) : (
                                                                        <Trash2 className="size-4" />
                                                                    )}
                                                                </Button>
                                                            ) : null}
                                                        </div>
                                                    </TableCell>
                                                ) : null}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : null}

                        {rows.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div
                                    className={cn(
                                        'flex items-center justify-between rounded-xl border px-4 py-3 text-sm',
                                        kpiCountValid
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-100'
                                            : 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100',
                                    )}
                                >
                                    <span className="font-medium">KPI count</span>
                                    <span className="text-base font-semibold tabular-nums">
                                        {kpiCount}
                                        {minKpis !== null && maxKpis !== null ? ` / ${minKpis}–${maxKpis}` : ''}
                                    </span>
                                </div>
                                <div
                                    className={cn(
                                        'flex items-center justify-between rounded-xl border px-4 py-3 text-sm',
                                        weightsValid
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-100'
                                            : 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100',
                                    )}
                                >
                                    <span className="font-medium">Total KPI weight</span>
                                    <span className="text-base font-semibold tabular-nums">{weightTotal.toFixed(2)}%</span>
                                </div>
                            </div>
                        ) : null}
                    </div>
                ) : null}

                <DialogFooter className="gap-2 sm:justify-end">
                    {canEditKpis && hasWeightChanges ? (
                        <Button type="button" onClick={saveWeights} disabled={saving || savingForm || removingId !== null}>
                            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                            Save weights
                        </Button>
                    ) : null}
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
