import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GoalLibrarySearchOption } from '@/types/performance';

interface GoalLibraryPickerProps {
    endpoint: string;
    excludeIds?: number[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onApply: (goals: GoalLibrarySearchOption[]) => void;
}

function buildEndpointUrl(endpoint: string, query: Record<string, string | number | undefined>): string {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
            params.append(key, String(value));
        }
    });

    const serialized = params.toString();

    return serialized ? `${endpoint}?${serialized}` : endpoint;
}

export default function GoalLibraryPicker({ endpoint, excludeIds = [], open, onOpenChange, onApply }: GoalLibraryPickerProps) {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<GoalLibrarySearchOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const abortRef = useRef<AbortController | null>(null);

    const excludeKey = useMemo(() => excludeIds.join(','), [excludeIds]);

    const loadResults = useCallback(
        async (term: string) => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;
            setLoading(true);

            try {
                const response = await fetch(
                    buildEndpointUrl(endpoint, {
                        q: term,
                        exclude: excludeKey || undefined,
                        limit: 100,
                    }),
                    {
                        signal: controller.signal,
                        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                        credentials: 'same-origin',
                    },
                );

                if (!response.ok) {
                    setResults([]);
                    return;
                }

                const payload = (await response.json()) as { results?: GoalLibrarySearchOption[] };
                setResults(payload.results ?? []);
            } catch (error) {
                if ((error as DOMException).name !== 'AbortError') {
                    setResults([]);
                }
            } finally {
                setLoading(false);
            }
        },
        [endpoint, excludeKey],
    );

    useEffect(() => {
        if (!open) {
            return;
        }

        setSelectedIds([]);
        setSearch('');

        const timer = window.setTimeout(() => {
            void loadResults('');
        }, 0);

        return () => window.clearTimeout(timer);
    }, [loadResults, open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const timer = window.setTimeout(() => {
            void loadResults(search.trim());
        }, 180);

        return () => window.clearTimeout(timer);
    }, [loadResults, open, search]);

    const toggleSelection = (goalId: number) => {
        setSelectedIds((current) => (current.includes(goalId) ? current.filter((id) => id !== goalId) : [...current, goalId]));
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === results.length) {
            setSelectedIds([]);
            return;
        }

        setSelectedIds(results.map((result) => result.value));
    };

    const handleApply = () => {
        const selectedGoals = results.filter((result) => selectedIds.includes(result.value));
        if (selectedGoals.length === 0) {
            return;
        }

        onApply(selectedGoals);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col">
                <DialogHeader>
                    <DialogTitle>Pick From KPIs</DialogTitle>
                    <DialogDescription>
                        Select one or more KPIs matched to this employee&apos;s department and job title. Applied KPIs are added to
                        your draft plan and are not saved until you choose Save Plan or Save and Submit.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative">
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search KPIs by title, measure, target, or perspective…"
                        className="pl-9"
                    />
                </div>

                <div className="min-h-[280px] flex-1 overflow-y-auto rounded-lg border">
                    {loading ? (
                        <div className="text-muted-foreground flex h-[280px] items-center justify-center gap-2 text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading KPIs…
                        </div>
                    ) : results.length === 0 ? (
                        <div className="text-muted-foreground flex h-[280px] items-center justify-center px-6 text-center text-sm">
                            {excludeIds.length > 0 && search.trim() === ''
                                ? 'No additional KPIs match this employee’s department and job title.'
                                : 'No KPIs match this employee’s department and job title. Try another keyword or add objectives manually.'}
                        </div>
                    ) : (
                        <div className="divide-y">
                            <div className="bg-muted/30 flex items-center justify-between gap-3 px-4 py-3">
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <Checkbox
                                        checked={results.length > 0 && selectedIds.length === results.length}
                                        onCheckedChange={toggleSelectAll}
                                    />
                                    Select all ({results.length})
                                </label>
                                <span className="text-muted-foreground text-xs">{selectedIds.length} selected</span>
                            </div>

                            {results.map((item) => {
                                const checked = selectedIds.includes(item.value);

                                return (
                                    <label
                                        key={item.value}
                                        className="hover:bg-muted/20 flex cursor-pointer items-start gap-3 px-4 py-4 transition-colors"
                                    >
                                        <Checkbox checked={checked} onCheckedChange={() => toggleSelection(item.value)} className="mt-0.5" />
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <div className="font-medium text-foreground">{item.label}</div>
                                            <div className="text-muted-foreground text-xs">
                                                {[item.perspective_name, item.job_title_name ? `Role: ${item.job_title_name}` : 'All roles']
                                                    .filter(Boolean)
                                                    .join(' · ')}
                                            </div>
                                            {item.kpi_measure ? (
                                                <div className="text-muted-foreground line-clamp-2 text-xs">{item.kpi_measure}</div>
                                            ) : null}
                                            {item.default_weight != null ? (
                                                <div className="text-muted-foreground text-xs">Default weight: {item.default_weight}%</div>
                                            ) : null}
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleApply} disabled={selectedIds.length === 0}>
                        Add {selectedIds.length > 0 ? `${selectedIds.length} ` : ''}KPI{selectedIds.length === 1 ? '' : 's'} to plan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
