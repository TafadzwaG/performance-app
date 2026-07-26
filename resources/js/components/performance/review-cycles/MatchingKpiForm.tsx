import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Option } from '@/types/performance';
import { Loader2, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface MatchingKpiFormValues {
    perspective_id: string;
    title: string;
    kpi_measure: string;
    default_weight: number;
    description: string;
}

interface Props {
    mode: 'create' | 'edit';
    initialValues: MatchingKpiFormValues;
    perspectiveOptions: Option[];
    saving?: boolean;
    onSubmit: (values: MatchingKpiFormValues) => void;
    onCancel: () => void;
}

export function createEmptyKpiFormValues(): MatchingKpiFormValues {
    return {
        perspective_id: '',
        title: '',
        kpi_measure: '',
        default_weight: 25,
        description: '',
    };
}

export default function MatchingKpiForm({ mode, initialValues, perspectiveOptions, saving = false, onSubmit, onCancel }: Props) {
    const [values, setValues] = useState<MatchingKpiFormValues>(initialValues);

    useEffect(() => {
        setValues(initialValues);
    }, [initialValues]);

    return (
        <form
            className="space-y-4 rounded-xl border bg-muted/20 p-4"
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit(values);
            }}
        >
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="font-medium">{mode === 'create' ? 'Add KPI' : 'Edit KPI'}</p>
                    <p className="text-muted-foreground text-sm">
                        {mode === 'create'
                            ? 'Create a KPI for this department and job title without leaving the review cycle.'
                            : 'Update the KPI details and weight.'}
                    </p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
                    <X className="size-4" />
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="matching-kpi-title">KPI title</Label>
                    <Input
                        id="matching-kpi-title"
                        value={values.title}
                        onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
                        placeholder="e.g. Improve customer satisfaction score"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="matching-kpi-perspective">Perspective</Label>
                    <Select
                        value={values.perspective_id || undefined}
                        onValueChange={(value) => setValues((current) => ({ ...current, perspective_id: value }))}
                    >
                        <SelectTrigger id="matching-kpi-perspective">
                            <SelectValue placeholder="Select perspective" />
                        </SelectTrigger>
                        <SelectContent>
                            {perspectiveOptions.map((option) => (
                                <SelectItem key={String(option.value)} value={String(option.value)}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="matching-kpi-weight">Weight (%)</Label>
                    <Input
                        id="matching-kpi-weight"
                        type="number"
                        min="0.01"
                        max="100"
                        step="0.01"
                        value={values.default_weight}
                        onChange={(event) =>
                            setValues((current) => ({
                                ...current,
                                default_weight: event.target.value === '' ? 0 : Number(event.target.value),
                            }))
                        }
                        required
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="matching-kpi-measure">Measure</Label>
                    <Input
                        id="matching-kpi-measure"
                        value={values.kpi_measure}
                        onChange={(event) => setValues((current) => ({ ...current, kpi_measure: event.target.value }))}
                        placeholder="How success will be measured"
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="matching-kpi-description">Description</Label>
                    <textarea
                        id="matching-kpi-description"
                        className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={values.description}
                        onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
                        placeholder="Optional context for this KPI"
                        rows={3}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={saving || !values.title || !values.perspective_id}>
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    {mode === 'create' ? 'Add KPI' : 'Save changes'}
                </Button>
            </div>
        </form>
    );
}
