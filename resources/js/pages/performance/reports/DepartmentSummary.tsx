import CycleFilters from '@/components/performance/CycleFilters';
import PerformancePage from '@/components/performance/PerformancePage';
import ReportTable from '@/components/performance/ReportTable';
import type { BreadcrumbItem } from '@/types';
import type { Option } from '@/types/performance';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Reports', href: route('performance.reports.index') },
    { title: 'Department Summary', href: route('performance.reports.department_summary') },
];

export default function DepartmentSummary({ rows, reviewCycleOptions, filters }: { rows: Array<Record<string, unknown>>; reviewCycleOptions: Option[]; filters: { review_cycle_id?: number | null } }) {
    return (
        <PerformancePage title="Department Summary" description="Appraisal completion and effective score averages by department." breadcrumbs={breadcrumbs}>
            <CycleFilters reviewCycleOptions={reviewCycleOptions} reviewCycleId={filters.review_cycle_id ?? null} reportRoute="performance.reports.department_summary" exportKey="department-summary" />
            <ReportTable rows={rows} />
        </PerformancePage>
    );
}
