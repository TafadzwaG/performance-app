import HeadingSmall from '@/components/heading-small';
import { Card, CardContent } from '@/components/ui/card';
import type { Appraisal } from '@/types/performance';
import AppraisalStatusBadge from './AppraisalStatusBadge';

export default function AppraisalHeader({ appraisal }: { appraisal: Appraisal }) {
    return (
        <Card>
            <CardContent className="grid gap-4 p-6 md:grid-cols-4">
                <div className="space-y-2">
                    <HeadingSmall title={appraisal.employee_name_snapshot} description={appraisal.employee_number_snapshot} />
                    <div className="text-sm text-muted-foreground">{appraisal.employee_email_snapshot}</div>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="font-medium">Cycle</div>
                    <div>{appraisal.cycle_name_snapshot}</div>
                    <div className="font-medium">Template</div>
                    <div>{appraisal.template_name_snapshot}</div>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="font-medium">Department</div>
                    <div>{appraisal.department_name_snapshot ?? 'Not set'}</div>
                    <div className="font-medium">Job Title</div>
                    <div>{appraisal.job_title_name_snapshot ?? 'Not set'}</div>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="font-medium">Status</div>
                    <AppraisalStatusBadge status={appraisal.status} />
                    <div className="font-medium">Line Manager</div>
                    <div>{appraisal.line_manager?.name ?? 'Not assigned'}</div>
                </div>
            </CardContent>
        </Card>
    );
}
