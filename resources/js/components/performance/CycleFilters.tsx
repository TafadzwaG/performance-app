import ReportExportButtons from '@/components/performance/ReportExportButtons';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Option } from '@/types/performance';
import { router } from '@inertiajs/react';
import { Filter } from 'lucide-react';

interface CycleFiltersProps {
    reviewCycleOptions: Option[];
    reviewCycleId?: number | null;
    reportRoute: string;
    exportKey?: string;
    reportTitle?: string;
}

export default function CycleFilters({
    reviewCycleOptions,
    reviewCycleId,
    reportRoute,
    exportKey,
    reportTitle,
}: CycleFiltersProps) {
    const applyFilter = (value: string) => {
        router.get(
            route(reportRoute),
            { review_cycle_id: value || undefined },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <Card className="shadow-sm">
            <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="grid gap-4 md:grid-cols-[minmax(260px,360px)_auto] md:items-end">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">Filters</Badge>
                            <span className="text-xs text-muted-foreground">Selection applies immediately</span>
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="review-cycle-filter"
                                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                            >
                                Review Cycle
                            </label>

                            <select
                                id="review-cycle-filter"
                                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex h-10 items-center rounded-md border bg-muted/30 px-3 text-sm text-muted-foreground">
                            <Filter className="mr-2 h-4 w-4" />
                            Auto filter
                        </div>
                    </div>
                </div>

                {exportKey && reportTitle ? (
                    <ReportExportButtons exportKey={exportKey} reportTitle={reportTitle} reviewCycleId={reviewCycleId} />
                ) : null}
            </CardContent>
        </Card>
    );
}
