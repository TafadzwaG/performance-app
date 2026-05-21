import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
    roles: string[];
    permissions: string[];
    requiresPasswordChange: boolean;
    hasEmployeeProfile: boolean;
    requiresEmployeeProfileCompletion: boolean;
    emailMfaEnabled: boolean;
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
    nav?: {
        employeesCount?: number | null;
        pendingAppraisalsCount?: number | null;
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
    [key: string]: unknown; // This allows for additional properties...
}
