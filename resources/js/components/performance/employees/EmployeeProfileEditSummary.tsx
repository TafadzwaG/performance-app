import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/date-utils';
import type { EmployeeProfile, EmployeeProfileFormData } from '@/types/performance';
import { Link } from '@inertiajs/react';
import { Briefcase, Eye, User2, UserCog, Users } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmployeeProfileEditSummaryProps {
    employeeProfile: EmployeeProfile;
    formData: EmployeeProfileFormData;
}

export default function EmployeeProfileEditSummary({
    employeeProfile,
    formData,
}: EmployeeProfileEditSummaryProps) {
    const userName = employeeProfile.user?.name ?? 'Employee';
    const roles = employeeProfile.user?.roles ?? [];

    const contactLine = [
        formData.home_address_line_1,
        formData.city,
        formData.state_province,
        formData.postal_code,
        formData.country,
    ]
        .filter((part) => typeof part === 'string' && part.trim() !== '')
        .join(', ');

    return (
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Card className="overflow-hidden shadow-sm">
                <CardHeader className="border-b bg-muted/20 pb-4">
                    <div className="flex items-start gap-4">
                        <div className="bg-secondary/40 text-foreground font-display flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border text-lg font-light">
                            {getInitials(userName)}
                        </div>
                        <div className="min-w-0 space-y-2">
                            <CardTitle className="font-display text-xl font-light tracking-tight">{userName}</CardTitle>
                            <CardDescription className="text-xs">
                                <Badge variant="secondary" className="font-mono text-[11px]">
                                    {employeeProfile.employee_number}
                                </Badge>
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-5 pt-5">
                    <SummarySection icon={User2} title="Account">
                        <SummaryRow label="Email" value={employeeProfile.user?.email ?? '—'} />
                        <SummaryRow
                            label="Roles"
                            value={
                                roles.length > 0 ? (
                                    <div className="flex flex-wrap justify-end gap-1">
                                        {roles.map((role) => (
                                            <Badge key={role.id} variant="outline" className="text-[11px]">
                                                {role.name}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    'No roles assigned'
                                )
                            }
                        />
                    </SummarySection>

                    <Separator />

                    <SummarySection icon={Briefcase} title="Employment">
                        <SummaryRow label="Department" value={employeeProfile.department?.name ?? '—'} />
                        <SummaryRow label="Job title" value={employeeProfile.job_title?.name ?? '—'} />
                        <SummaryRow label="Status" value={formatLabel(employeeProfile.employment_status)} />
                        <SummaryRow label="Type" value={formatLabel(employeeProfile.employment_type)} />
                        <SummaryRow label="Work location" value={employeeProfile.work_location ?? '—'} />
                        <SummaryRow label="Hire date" value={formatDate(employeeProfile.hire_date)} />
                        <SummaryRow
                            label="Active"
                            value={employeeProfile.is_active ? 'Active' : 'Inactive'}
                        />
                    </SummarySection>

                    <Separator />

                    <SummarySection icon={UserCog} title="Reporting">
                        <SummaryRow label="Line manager" value={employeeProfile.line_manager?.name ?? '—'} />
                        <SummaryRow
                            label="Approving manager"
                            value={employeeProfile.approving_manager?.name ?? '—'}
                        />
                    </SummarySection>

                    <Separator />

                    <SummarySection icon={Users} title="Contact (your edits)">
                        <SummaryRow label="Phone" value={displayValue(formData.personal_phone)} />
                        <SummaryRow label="Address" value={contactLine || '—'} multiline />
                        <SummaryRow label="Emergency contact" value={displayValue(formData.emergency_contact_name)} />
                        <SummaryRow label="Emergency phone" value={displayValue(formData.emergency_contact_phone)} />
                    </SummarySection>

                    <Button asChild variant="outline" className="w-full">
                        <Link href={route('performance.profile.show')}>
                            <Eye className="mr-2 h-4 w-4" />
                            View full profile
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            <p className="text-muted-foreground px-1 text-xs leading-5">
                Employment and reporting details are managed by HR. Changes you make here apply to your personal and
                contact information only.
            </p>
        </aside>
    );
}

function SummarySection({
    icon: Icon,
    title,
    children,
}: {
    icon: typeof User2;
    title: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-3">
            <div className="font-mono-brand text-muted-foreground flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase">
                <Icon className="h-3.5 w-3.5" />
                {title}
            </div>
            <div className="space-y-2.5">{children}</div>
        </div>
    );
}

function SummaryRow({
    label,
    value,
    multiline = false,
}: {
    label: string;
    value: ReactNode;
    multiline?: boolean;
}) {
    return (
        <div className="flex items-start justify-between gap-3 text-sm">
            <span className="text-muted-foreground shrink-0">{label}</span>
            <span
                className={
                    multiline
                        ? 'text-foreground max-w-[58%] text-right text-[13px] leading-5'
                        : 'text-foreground max-w-[58%] text-right font-medium'
                }
            >
                {value}
            </span>
        </div>
    );
}

function displayValue(value?: string | null) {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
        return '—';
    }

    return value;
}

function formatLabel(value?: string | null) {
    if (!value) {
        return '—';
    }

    return value
        .replace(/_/g, ' ')
        .split(' ')
        .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
        .join(' ');
}

function getInitials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}
