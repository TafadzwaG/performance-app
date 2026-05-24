import { Badge } from '@/components/ui/badge';
import type { IssueStatus } from '@/types/issues';
import { issueStatusLabels } from '@/types/issues';

const statusStyles: Record<IssueStatus, string> = {
    pending: 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900/50',
    in_progress: 'bg-sky-100 text-sky-900 border-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-900/50',
    completed: 'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900/50',
};

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
    return (
        <Badge variant="outline" className={statusStyles[status]}>
            {issueStatusLabels[status]}
        </Badge>
    );
}
