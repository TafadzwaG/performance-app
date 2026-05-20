import { Card, CardContent } from '@/components/ui/card';
import type { Appraisal } from '@/types/performance';
import AppraisalStatusBadge from './AppraisalStatusBadge';

interface MetaPairProps {
    label: string;
    value: React.ReactNode;
}

function MetaPair({ label, value }: MetaPairProps) {
    return (
        <div>
            <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">{label}</div>
            <div className="text-foreground mt-1 text-[13px] leading-snug">{value}</div>
        </div>
    );
}

export default function AppraisalHeader({ appraisal }: { appraisal: Appraisal }) {
    return (
        <Card className="shadow-sm">
            <CardContent className="grid gap-5 p-6 md:grid-cols-4">
                <div className="space-y-2 md:col-span-1">
                    <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                        § Employee
                    </div>
                    <div className="font-display text-foreground text-2xl leading-tight font-light tracking-tight">
                        {appraisal.employee_name_snapshot}
                    </div>
                    <div className="text-muted-foreground font-mono-brand text-[11px] tracking-[0.16em]">
                        {appraisal.employee_number_snapshot}
                    </div>
                    <div className="text-muted-foreground text-[12px]">{appraisal.employee_email_snapshot}</div>
                </div>

                <div className="space-y-3">
                    <MetaPair label="Cycle" value={appraisal.cycle_name_snapshot} />
                    <MetaPair label="Template" value={appraisal.template_name_snapshot} />
                </div>

                <div className="space-y-3">
                    <MetaPair label="Department" value={appraisal.department_name_snapshot ?? 'Not set'} />
                    <MetaPair label="Job Title" value={appraisal.job_title_name_snapshot ?? 'Not set'} />
                </div>

                <div className="space-y-3">
                    <MetaPair label="Status" value={<AppraisalStatusBadge status={appraisal.status} />} />
                    <MetaPair label="Line Manager" value={appraisal.line_manager?.name ?? 'Not assigned'} />
                </div>
            </CardContent>
        </Card>
    );
}
