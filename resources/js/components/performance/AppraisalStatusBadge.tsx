import { Badge } from '@/components/ui/badge';

const statusMap: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700' },
    goal_setting: { label: 'Goal Setting', className: 'bg-blue-100 text-blue-700' },
    self_assessment_pending: { label: 'Self Assessment Pending', className: 'bg-amber-100 text-amber-700' },
    self_assessment_submitted: { label: 'Self Assessment Submitted', className: 'bg-cyan-100 text-cyan-700' },
    manager_review_pending: { label: 'Manager Review Pending', className: 'bg-orange-100 text-orange-700' },
    manager_review_completed: { label: 'Manager Review Completed', className: 'bg-indigo-100 text-indigo-700' },
    approval_pending: { label: 'Approval Pending', className: 'bg-fuchsia-100 text-fuchsia-700' },
    approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700' },
    sent_back: { label: 'Sent Back', className: 'bg-rose-100 text-rose-700' },
    finalized: { label: 'Finalized', className: 'bg-teal-100 text-teal-700' },
};

export default function AppraisalStatusBadge({ status }: { status: string }) {
    const config = statusMap[status] ?? { label: status, className: 'bg-slate-100 text-slate-700' };

    return (
        <Badge variant="outline" className={config.className}>
            {config.label}
        </Badge>
    );
}
