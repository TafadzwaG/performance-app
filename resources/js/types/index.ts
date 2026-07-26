import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
    roles: string[];
    permissions: string[];
    requiresPasswordChange: boolean;
    hasEmployeeProfile: boolean;
    requiresEmployeeProfileCompletion: boolean;
    emailMfaEnabled: boolean;
    canReportIssue?: boolean;
    impersonation: {
        isImpersonating: boolean;
        impersonator: Pick<User, 'id' | 'name' | 'email'> | null;
    };
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    badge?: string | number;
    isActive?: boolean;
    items?: NavItem[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    tenant?: {
        current: { id: number; name: string; slug: string; timezone: string } | null;
        organizations: Array<{ id: number; name: string; slug: string }>;
        supportAccess: boolean;
        workflow?: {
            calibration_enabled: boolean;
            enabled_stages: Array<
                'goal_setting' | 'self_assessment' | 'manager_review' | 'approval' | 'calibration' | 'final_record'
            >;
        } | null;
    };
    nav?: {
        employeesCount?: number | null;
        pendingAppraisalsCount?: number | null;
        showMyKpis?: boolean;
        profileUrl?: string | null;
    };
    branding?: {
        logoUrl?: string | null;
        companyName?: string | null;
    };
    flash: {
        success?: string | null;
        info?: string | null;
        warning?: string | null;
        error?: string | null;
        generatedCredentials?: Array<{ name: string; email: string; password: string }> | null;
        showFinalizeNextSteps?: boolean;
    };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    is_platform_admin?: boolean;
    [key: string]: unknown; // This allows for additional properties...
}
