import CycleFilters from '@/components/performance/CycleFilters';
import PerformancePage from '@/components/performance/PerformancePage';
import ReportTable from '@/components/performance/ReportTable';
import type { BreadcrumbItem } from '@/types';
import type { Option } from '@/types/performance';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Reports', href: route('performance.reports.index') },
    { title: 'Overdue Reviews', href: route('performance.reports.overdue_reviews') },
];

export default function OverdueReviews({ rows, reviewCycleOptions, filters }: { rows: Array<Record<string, unknown>>; reviewCycleOptions: Option[]; filters: { review_cycle_id?: number | null } }) {
    return (
        <PerformancePage title="Overdue Reviews" description="Identify self-assessments, manager reviews, and approvals that are overdue." breadcrumbs={breadcrumbs}>
            <CycleFilters reviewCycleOptions={reviewCycleOptions} reviewCycleId={filters.review_cycle_id ?? null} reportRoute="performance.reports.overdue_reviews" exportKey="overdue-reviews" />
            <ReportTable rows={rows} />
        </PerformancePage>
    );
}
