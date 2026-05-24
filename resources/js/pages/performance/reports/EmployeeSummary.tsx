import CycleFilters from '@/components/performance/CycleFilters';
import PerformancePage from '@/components/performance/PerformancePage';
import ReportTable from '@/components/performance/ReportTable';
import type { BreadcrumbItem } from '@/types';
import type { Option } from '@/types/performance';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Reports', href: route('performance.reports.index') },
    { title: 'Employee Summary', href: route('performance.reports.employee_summary') },
];

export default function EmployeeSummary({ rows, reviewCycleOptions, filters }: { rows: Array<Record<string, unknown>>; reviewCycleOptions: Option[]; filters: { review_cycle_id?: number | null } }) {
    return (
        <PerformancePage title="Employee Summary" description="Per-employee appraisal outcome and effective score summary." breadcrumbs={breadcrumbs}>
            <CycleFilters reviewCycleOptions={reviewCycleOptions} reviewCycleId={filters.review_cycle_id ?? null} reportRoute="performance.reports.employee_summary" exportKey="employee-summary" reportTitle="Employee Summary" />
            <ReportTable rows={rows} />
        </PerformancePage>
    );
}
