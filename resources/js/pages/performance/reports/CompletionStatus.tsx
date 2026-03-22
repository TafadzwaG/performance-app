import CycleFilters from '@/components/performance/CycleFilters';
import PerformancePage from '@/components/performance/PerformancePage';
import ReportTable from '@/components/performance/ReportTable';
import type { BreadcrumbItem } from '@/types';
import type { Option } from '@/types/performance';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Reports', href: route('performance.reports.index') },
    { title: 'Completion Status', href: route('performance.reports.completion_status') },
];

export default function CompletionStatus({ rows, reviewCycleOptions, filters }: { rows: Array<Record<string, unknown>>; reviewCycleOptions: Option[]; filters: { review_cycle_id?: number | null } }) {
    return (
        <PerformancePage title="Completion Status" description="Workflow status counts for the selected cycle." breadcrumbs={breadcrumbs}>
            <CycleFilters reviewCycleOptions={reviewCycleOptions} reviewCycleId={filters.review_cycle_id ?? null} reportRoute="performance.reports.completion_status" exportKey="completion-status" />
            <ReportTable rows={rows} />
        </PerformancePage>
    );
}
