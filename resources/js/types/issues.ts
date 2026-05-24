import type { Option, Paginated } from '@/types/performance';

export type IssueStatus = 'pending' | 'in_progress' | 'completed';

export type IssueType =
    | 'bug'
    | 'access_login'
    | 'data_problem'
    | 'performance'
    | 'feature_request'
    | 'other';

export interface IssueUser {
    id: number;
    name: string;
    email: string;
}

export interface IssueStatusHistory {
    id: number;
    issue_report_id: number;
    actor_user_id: number;
    from_status: IssueStatus | null;
    to_status: IssueStatus | null;
    from_assignee_user_id: number | null;
    to_assignee_user_id: number | null;
    note: string | null;
    created_at: string;
    actor?: IssueUser;
    from_assignee?: IssueUser | null;
    to_assignee?: IssueUser | null;
}

export interface IssueReport {
    id: number;
    reference: string;
    reporter_user_id: number;
    assignee_user_id: number | null;
    type: IssueType;
    title: string;
    description: string;
    status: IssueStatus;
    created_at: string;
    updated_at: string;
    reporter?: IssueUser;
    assignee?: IssueUser | null;
    histories?: IssueStatusHistory[];
}

export interface IssueFilters {
    search: string;
    status: string;
    type: string;
    assignee_user_id: string;
    reporter_user_id: string;
}

export const issueTypeLabels: Record<IssueType, string> = {
    bug: 'Bug',
    access_login: 'Access/Login',
    data_problem: 'Data Problem',
    performance: 'Performance',
    feature_request: 'Feature Request',
    other: 'Other',
};

export const issueStatusLabels: Record<IssueStatus, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
};

export type IssuePaginated = Paginated<IssueReport>;
export type IssueOption = Option;
