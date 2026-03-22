import PerformancePage from '@/components/performance/PerformancePage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Appraisal } from '@/types/performance';
import type { BreadcrumbItem } from '@/types';
import AppraisalStatusBadge from '@/components/performance/AppraisalStatusBadge';

interface Props {
    metrics: Record<string, number>;
    myAppraisals: Appraisal[];
    teamPending: Appraisal[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
];

export default function DashboardIndex({ metrics, myAppraisals, teamPending }: Props) {
    return (
        <PerformancePage title="Performance Dashboard" description="Track appraisal workload, review queues, and cycle health." breadcrumbs={breadcrumbs}>
            <div className="grid gap-4 md:grid-cols-5">
                {Object.entries(metrics).map(([key, value]) => (
                    <Card key={key}>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium capitalize">{key.replaceAll('_', ' ')}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-3xl font-semibold">{value}</CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>My Appraisals</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {myAppraisals.map((appraisal) => (
                            <div key={appraisal.id} className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                    <div className="font-medium">{appraisal.cycle_name_snapshot}</div>
                                    <div className="text-sm text-muted-foreground">{appraisal.template_name_snapshot}</div>
                                </div>
                                <AppraisalStatusBadge status={appraisal.status} />
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Team Pending Reviews</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {teamPending.map((appraisal) => (
                            <div key={appraisal.id} className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                    <div className="font-medium">{appraisal.employee_name_snapshot}</div>
                                    <div className="text-sm text-muted-foreground">{appraisal.cycle_name_snapshot}</div>
                                </div>
                                <AppraisalStatusBadge status={appraisal.status} />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </PerformancePage>
    );
}
