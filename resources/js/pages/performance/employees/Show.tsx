import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/date-utils';
import type { BreadcrumbItem } from '@/types';
import type { EmployeeProfile } from '@/types/performance';
import { Link } from '@inertiajs/react';
import {
    Briefcase,
    CalendarDays,
    Contact,
    FileText,
    History,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
    User2,
    UserCog,
    Users,
    PencilLine,
} from 'lucide-react';

const breadcrumbs = (profile: EmployeeProfile): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Employees', href: route('performance.employees.index') },
    { title: profile.user?.name ?? profile.employee_number, href: route('performance.employees.show', profile.id) },
];

export default function EmployeeShow({ employeeProfile }: { employeeProfile: EmployeeProfile }) {
    const userName = employeeProfile.user?.name ?? employeeProfile.employee_number;
    const roles = employeeProfile.user?.roles ?? [];
    const appraisals = employeeProfile.appraisals ?? [];

    return (
        <PerformancePage
            title={userName}
            description="Employee profile, reporting lines, role assignments, and appraisal history."
            breadcrumbs={breadcrumbs(employeeProfile)}
            secondaryActions={
                <Button asChild variant="outline">
                    <Link href={route('performance.employees.edit', employeeProfile.id)}>
                        <PencilLine className="mr-2 h-4 w-4" />
                        Edit Profile
                    </Link>
                </Button>
            }
        >
            <div className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-20 w-20 items-center justify-center rounded-xl border bg-muted/30 text-xl font-semibold text-foreground">
                                {getInitials(userName)}
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                            {userName}
                                        </h1>
                                        <Badge variant="secondary">{employeeProfile.employee_number}</Badge>
                                    </div>

                                    <p className="text-sm text-muted-foreground">
                                        {employeeProfile.job_title?.name ?? 'No job title'} •{' '}
                                        {employeeProfile.department?.name ?? 'No department'}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {roles.length > 0 ? (
                                        roles.map((role) => (
                                            <Badge key={role.id} variant="outline">
                                                {role.name}
                                            </Badge>
                                        ))
                                    ) : (
                                        <Badge variant="outline">No roles assigned</Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Active Status</div>
                                <div className="mt-1 font-semibold text-foreground">
                                    {employeeProfile.is_active ? 'Active' : 'Inactive'}
                                </div>
                            </div>

                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Review Status</div>
                                <div className="mt-1 font-semibold text-foreground">
                                    {employeeProfile.is_review_eligible ?? true
                                        ? 'Review Eligible'
                                        : 'Not Review Eligible'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-12">
                    <div className="space-y-6 lg:col-span-4">
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <ShieldCheck className="h-4.5 w-4.5" />
                                    <CardTitle className="text-sm font-medium">Operational Status</CardTitle>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                                    <span className="text-sm text-muted-foreground">Active Status</span>
                                    <Badge variant={employeeProfile.is_active ? 'secondary' : 'outline'}>
                                        {employeeProfile.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                                    <span className="text-sm text-muted-foreground">Review Eligibility</span>
                                    <Badge
                                        variant={(employeeProfile.is_review_eligible ?? true) ? 'secondary' : 'outline'}
                                    >
                                        {(employeeProfile.is_review_eligible ?? true)
                                            ? 'Eligible'
                                            : 'Not Eligible'}
                                    </Badge>
                                </div>

                                <div className="rounded-lg border bg-muted/20 p-4">
                                    <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                                        Internal Notes
                                    </div>
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        {employeeProfile.notes ?? 'No employee notes recorded.'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <UserCog className="h-4.5 w-4.5" />
                                    <CardTitle className="text-sm font-medium">Reporting Line</CardTitle>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <MiniPersonCard
                                    label="Line Manager"
                                    name={employeeProfile.line_manager?.name ?? 'Not assigned'}
                                />

                                <MiniPersonCard
                                    label="Approving Manager"
                                    name={employeeProfile.approving_manager?.name ?? 'Not assigned'}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6 lg:col-span-8">
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="shadow-sm">
                                <CardHeader>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <User2 className="h-4.5 w-4.5" />
                                        <CardTitle className="text-base">Identity</CardTitle>
                                    </div>
                                    <CardDescription>Core employee and personal identity details.</CardDescription>
                                </CardHeader>

                                <CardContent className="grid gap-4">
                                    <Info label="Employee Number" value={employeeProfile.employee_number} />
                                    <Info label="National ID" value={maskNationalId(employeeProfile.national_id)} />
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Info label="Date of Birth" value={formatDate(employeeProfile.date_of_birth, '-')} />
                                        <Info label="Gender" value={formatValue(employeeProfile.gender)} />
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Info label="Marital Status" value={formatValue(employeeProfile.marital_status)} />
                                        <Info label="User Account" value={employeeProfile.user?.email ?? '-'} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm">
                                <CardHeader>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Contact className="h-4.5 w-4.5" />
                                        <CardTitle className="text-base">Contact & Address</CardTitle>
                                    </div>
                                    <CardDescription>
                                        Personal contact and emergency contact information.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="grid gap-4">
                                    <Info
                                        label="Personal Phone"
                                        value={employeeProfile.personal_phone ?? '-'}
                                        icon={<Phone className="h-4 w-4" />}
                                    />
                                    <Info label="Emergency Contact" value={employeeProfile.emergency_contact_name ?? '-'} />
                                    <Info
                                        label="Emergency Phone"
                                        value={employeeProfile.emergency_contact_phone ?? '-'}
                                        icon={<Phone className="h-4 w-4" />}
                                    />
                                    <Info
                                        label="Address"
                                        value={formatAddress(employeeProfile)}
                                        icon={<MapPin className="h-4 w-4" />}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Briefcase className="h-4.5 w-4.5" />
                                    <CardTitle className="text-base">Employment Details</CardTitle>
                                </div>
                                <CardDescription>
                                    Organizational placement and performance-related employment settings.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                <Info label="Department" value={employeeProfile.department?.name ?? '-'} />
                                <Info label="Job Title" value={employeeProfile.job_title?.name ?? '-'} />
                                <Info label="Employment Status" value={employeeProfile.employment_status} />
                                <Info label="Employment Type" value={formatValue(employeeProfile.employment_type)} />
                                <Info label="Work Location" value={employeeProfile.work_location ?? '-'} />
                                <Info label="Hire Date" value={formatDate(employeeProfile.hire_date, '-')} />
                                <Info label="Probation End" value={formatDate(employeeProfile.probation_end_date, '-')} />
                                <Info label="Confirmation Date" value={formatDate(employeeProfile.confirmation_date, '-')} />
                                <Info
                                    label="Review Eligibility Date"
                                    value={formatDate(employeeProfile.review_eligibility_date, '-')}
                                />
                            </CardContent>
                        </Card>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="shadow-sm">
                                <CardHeader>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Users className="h-4.5 w-4.5" />
                                        <CardTitle className="text-base">Role Assignments</CardTitle>
                                    </div>
                                    <CardDescription>
                                        Current application roles from the linked user account.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent>
                                    {roles.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {roles.map((role) => (
                                                <Badge key={role.id} variant="outline">
                                                    {role.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No roles assigned.</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm">
                                <CardHeader>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-4.5 w-4.5" />
                                        <CardTitle className="text-base">Linked Account</CardTitle>
                                    </div>
                                    <CardDescription>Connected user identity and access reference.</CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-3">
                                    <div className="rounded-lg border bg-muted/20 p-4">
                                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                            User Email
                                        </div>
                                        <div className="mt-2 text-sm font-medium text-foreground">
                                            {employeeProfile.user?.email ?? '-'}
                                        </div>
                                    </div>

                                    <div className="rounded-lg border bg-muted/20 p-4">
                                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                            Employee Record
                                        </div>
                                        <div className="mt-2 text-sm font-medium text-foreground">
                                            {employeeProfile.employee_number}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <History className="h-4.5 w-4.5" />
                                    <CardTitle className="text-base">Appraisal History</CardTitle>
                                </div>
                                <CardDescription>
                                    Cycle history and current performance workflow state.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                {appraisals.length > 0 ? (
                                    appraisals.map((appraisal) => (
                                        <div
                                            key={appraisal.id}
                                            className="flex flex-col gap-4 rounded-xl border bg-muted/10 p-4 md:flex-row md:items-center md:justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background text-muted-foreground">
                                                    <CalendarDays className="h-4.5 w-4.5" />
                                                </div>

                                                <div>
                                                    <div className="font-medium text-foreground">
                                                        {appraisal.cycle_name_snapshot}
                                                    </div>
                                                    <div className="mt-1 text-xs text-muted-foreground">
                                                        Status: {formatValue(appraisal.status)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-left md:text-right">
                                                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                                    Performance Score
                                                </div>
                                                <div className="mt-1 text-lg font-semibold text-foreground">
                                                    {appraisal.overall_score !== undefined &&
                                                    appraisal.overall_score !== null
                                                        ? appraisal.overall_score
                                                        : '-'}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No appraisal history recorded yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </PerformancePage>
    );
}

function MiniPersonCard({ label, name }: { label: string; name: string }) {
    return (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-background text-xs font-semibold text-foreground">
                {getInitials(name)}
            </div>
            <div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
                <div className="text-sm font-medium text-foreground">{name}</div>
            </div>
        </div>
    );
}

function Info({
    label,
    value,
    icon,
}: {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border bg-muted/10 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {icon}
                <span>{label}</span>
            </div>
            <div className="mt-2 text-base font-semibold text-foreground">{value}</div>
        </div>
    );
}

function formatValue(value?: string | null) {
    if (!value) return '-';

    return value
        .replace(/_/g, ' ')
        .split(' ')
        .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
        .join(' ');
}

function formatAddress(profile: EmployeeProfile) {
    const parts = [
        profile.home_address_line_1,
        profile.home_address_line_2,
        profile.city,
        profile.state_province,
        profile.postal_code,
        profile.country,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : '-';
}

function getInitials(name?: string | null) {
    return (name ?? 'U')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

function maskNationalId(value?: string | null) {
    if (!value) return '-';
    if (value.length <= 4) return value;

    return `***-**-${value.slice(-4)}`;
}
