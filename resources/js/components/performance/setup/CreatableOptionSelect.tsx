import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Option } from '@/types/performance';
import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';

type EntityType = 'department' | 'job_title';

interface Props {
    label: string;
    required?: boolean;
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    onOptionCreated: (option: Option) => void;
    error?: string;
    placeholder: string;
    canCreate?: boolean;
    entityType: EntityType;
}

function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

function quickStoreRoute(entityType: EntityType) {
    return entityType === 'department'
        ? route('performance.setup.departments.quick_store')
        : route('performance.setup.job_titles.quick_store');
}

export default function CreatableOptionSelect({
    label,
    required,
    value,
    onChange,
    options,
    onOptionCreated,
    error,
    placeholder,
    canCreate = false,
    entityType,
}: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const entityLabel = entityType === 'department' ? 'department' : 'job title';

    const createOption = async () => {
        const trimmed = name.trim();

        if (!trimmed) {
            setCreateError(`Enter a ${entityLabel} name.`);
            return;
        }

        setSaving(true);
        setCreateError(null);

        try {
            const response = await fetch(quickStoreRoute(entityType), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ name: trimmed }),
            });

            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                const message =
                    payload?.message ||
                    payload?.errors?.name?.[0] ||
                    `Unable to create ${entityLabel}.`;

                throw new Error(message);
            }

            const option = payload.option as Option;
            onOptionCreated(option);
            onChange(String(option.value));
            setName('');
            setDialogOpen(false);
        } catch (createFailure) {
            setCreateError(createFailure instanceof Error ? createFailure.message : `Unable to create ${entityLabel}.`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {label}
                        {required ? ' *' : ''}
                    </Label>
                    {canCreate ? (
                        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setDialogOpen(true)}>
                            <Plus className="mr-1 size-3.5" />
                            Create {entityLabel}
                        </Button>
                    ) : null}
                </div>
                <Select value={value || '__empty__'} onValueChange={(next) => onChange(next === '__empty__' ? '' : next)}>
                    <SelectTrigger className="h-10">
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__empty__">{placeholder}</SelectItem>
                        {options.map((option) => (
                            <SelectItem key={String(option.value)} value={String(option.value)}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={error} />
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create {entityLabel}</DialogTitle>
                        <DialogDescription>
                            Add a new {entityLabel} to this organization and select it immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor={`create-${entityType}-name`}>Name</Label>
                        <Input
                            id={`create-${entityType}-name`}
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder={entityType === 'department' ? 'e.g. Finance' : 'e.g. Performance Analyst'}
                            autoFocus
                        />
                        {createError ? <p className="text-destructive text-sm">{createError}</p> : null}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={createOption} disabled={saving}>
                            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                            Create & select
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
