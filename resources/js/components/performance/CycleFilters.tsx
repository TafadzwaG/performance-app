import { Button } from '@/components/ui/button';
import type { Option } from '@/types/performance';
import { router } from '@inertiajs/react';

interface CycleFiltersProps {
    reviewCycleOptions: Option[];
    reviewCycleId?: number | null;
    reportRoute: string;
    exportKey?: string;
}

export default function CycleFilters({ reviewCycleOptions, reviewCycleId, reportRoute, exportKey }: CycleFiltersProps) {
    const applyFilter = (value: string) => {
        router.get(
            route(reportRoute),
            { review_cycle_id: value || undefined },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4">
            <select
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={reviewCycleId ?? ''}
                onChange={(event) => applyFilter(event.target.value)}
            >
                <option value="">All cycles</option>
                {reviewCycleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {exportKey ? (
                <Button asChild variant="outline">
                    <a href={route('performance.reports.export', { report: exportKey, review_cycle_id: reviewCycleId ?? undefined })}>Export Excel</a>
                </Button>
            ) : null}
        </div>
    );
}
