import AppraisalHeader from '@/components/performance/AppraisalHeader';
import PerformancePage from '@/components/performance/PerformancePage';
import ScoreSummaryCard from '@/components/performance/ScoreSummaryCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal } from '@/types/performance';
import { useForm } from '@inertiajs/react';

interface Props {
    appraisal: Appraisal;
}

const breadcrumbs = (appraisal: Appraisal): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Appraisals', href: route('performance.appraisals.index') },
    { title: appraisal.employee_name_snapshot, href: route('performance.appraisals.show', appraisal.id) },
    { title: 'Finalize', href: route('performance.appraisals.finalize', appraisal.id) },
];

export default function Finalize({ appraisal }: Props) {
    const { data, setData, post, processing } = useForm({
        comment: '',
    });

    return (
        <PerformancePage title="Finalize Appraisal" description="Lock the final result and release the final print pack." breadcrumbs={breadcrumbs(appraisal)}>
            <AppraisalHeader appraisal={appraisal} />
            <ScoreSummaryCard
                businessScore={appraisal.business_score}
                valuesScore={appraisal.values_score}
                overallScore={appraisal.overall_score}
                overallRating={appraisal.overall_rating_level?.label ?? null}
            />
            <Card>
                <CardHeader>
                    <CardTitle>Finalization Note</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <textarea className="min-h-28 w-full rounded-md border bg-background px-3 py-2" value={data.comment} onChange={(event) => setData('comment', event.target.value)} />
                    <Button type="button" onClick={() => post(route('performance.appraisals.finalize.store', appraisal.id))} disabled={processing}>
                        Finalize Appraisal
                    </Button>
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
