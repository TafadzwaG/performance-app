import CycleFilters from '@/components/performance/CycleFilters';
import PerformancePage from '@/components/performance/PerformancePage';
import ReportTable from '@/components/performance/ReportTable';
import type { BreadcrumbItem } from '@/types';
import type { Option } from '@/types/performance';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Reports', href: route('performance.reports.index') },
    { title: 'Cycle Summary', href: route('performance.reports.cycle_summary') },
];

export default function CycleSummary({ rows, reviewCycleOptions, filters }: { rows: Array<Record<string, unknown>>; reviewCycleOptions: Option[]; filters: { review_cycle_id?: number | null } }) {
    return (
        <PerformancePage title="Cycle Summary" description="Summarised appraisal totals and average effective score by cycle." breadcrumbs={breadcrumbs}>
            <CycleFilters reviewCycleOptions={reviewCycleOptions} reviewCycleId={filters.review_cycle_id ?? null} reportRoute="performance.reports.cycle_summary" exportKey="cycle-summary" />
            <ReportTable rows={rows} />
        </PerformancePage>
    );
}
