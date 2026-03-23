import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { EmployeeProfileFormData, Option } from '@/types/performance';
import type { InertiaFormProps } from '@inertiajs/react';
import {
    Briefcase,
    Contact,
    FileText,
    ShieldCheck,
    User2,
    Users,
} from 'lucide-react';

interface EmployeeProfileFormProps {
    form: InertiaFormProps<EmployeeProfileFormData>;
    mode: 'create' | 'edit';
    departmentOptions: Option[];
    jobTitleOptions: Option[];
    userOptions: Option[];
    roleOptions: Option[];
    employmentStatusOptions: Option[];
    genderOptions: Option[];
    maritalStatusOptions: Option[];
    employmentTypeOptions: Option[];
    canAssignRoles: boolean;
}

export default function EmployeeProfileForm({
    form,
    mode,
    departmentOptions,
    jobTitleOptions,
    userOptions,
    roleOptions,
    employmentStatusOptions,
    genderOptions,
    maritalStatusOptions,
    employmentTypeOptions,
    canAssignRoles,
}: EmployeeProfileFormProps) {
    const selectedUser = userOptions.find((option) => String(option.value) === String(form.data.user_id));

    return (
        <div className="space-y-6">
            <SectionCard
                step="Step 01 / 04"
                icon={<User2 className="h-4.5 w-4.5 text-muted-foreground" />}
                title="Identity"
                description="Core employee identity and personal details used across performance records."
            >
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {mode === 'create' ? (
                        <SelectField
                            label="User"
                            value={form.data.user_id}
                            onChange={(value) => form.setData('user_id', value)}
                            options={userOptions}
                            error={form.errors.user_id}
                            placeholder="Select user"
                        />
                    ) : (
                        <ReadOnlyField label="User" value={selectedUser?.label ?? 'Unknown user'} />
                    )}

                    <TextField
                        label="Employee Number"
                        value={form.data.employee_number}
                        onChange={(value) => form.setData('employee_number', value)}
                        error={form.errors.employee_number}
                    />

                    <TextField
                        label="National ID"
                        value={form.data.national_id}
                        onChange={(value) => form.setData('national_id', value)}
                        error={form.errors.national_id}
                    />

                    <DateField
                        label="Date of Birth"
                        value={form.data.date_of_birth}
                        onChange={(value) => form.setData('date_of_birth', value)}
                        error={form.errors.date_of_birth}
                    />

                    <SelectField
                        label="Gender"
                        value={form.data.gender}
                        onChange={(value) => form.setData('gender', value)}
                        options={genderOptions}
                        error={form.errors.gender}
                        placeholder="Select gender"
                    />

                    <SelectField
                        label="Marital Status"
                        value={form.data.marital_status}
                        onChange={(value) => form.setData('marital_status', value)}
                        options={maritalStatusOptions}
                        error={form.errors.marital_status}
                        placeholder="Select marital status"
                    />
                </div>
            </SectionCard>

            <SectionCard
                step="Step 02 / 04"
                icon={<Contact className="h-4.5 w-4.5 text-muted-foreground" />}
                title="Contact & Address"
                description="Home contact information and emergency contact details."
            >
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    <TextField
                        label="Personal Phone"
                        value={form.data.personal_phone}
                        onChange={(value) => form.setData('personal_phone', value)}
                        error={form.errors.personal_phone}
                    />

                    <TextField
                        label="Emergency Contact Name"
                        value={form.data.emergency_contact_name}
                        onChange={(value) => form.setData('emergency_contact_name', value)}
                        error={form.errors.emergency_contact_name}
                    />

                    <TextField
                        label="Emergency Contact Phone"
                        value={form.data.emergency_contact_phone}
                        onChange={(value) => form.setData('emergency_contact_phone', value)}
                        error={form.errors.emergency_contact_phone}
                    />

                    <TextField
                        label="Address Line 1"
                        value={form.data.home_address_line_1}
                        onChange={(value) => form.setData('home_address_line_1', value)}
                        error={form.errors.home_address_line_1}
                        className="xl:col-span-2"
                    />

                    <TextField
                        label="Address Line 2"
                        value={form.data.home_address_line_2}
                        onChange={(value) => form.setData('home_address_line_2', value)}
                        error={form.errors.home_address_line_2}
                    />

                    <TextField
                        label="City"
                        value={form.data.city}
                        onChange={(value) => form.setData('city', value)}
                        error={form.errors.city}
                    />

                    <TextField
                        label="State / Province"
                        value={form.data.state_province}
                        onChange={(value) => form.setData('state_province', value)}
                        error={form.errors.state_province}
                    />

                    <TextField
                        label="Postal Code"
                        value={form.data.postal_code}
                        onChange={(value) => form.setData('postal_code', value)}
                        error={form.errors.postal_code}
                    />

                    <TextField
                        label="Country"
                        value={form.data.country}
                        onChange={(value) => form.setData('country', value)}
                        error={form.errors.country}
                    />
                </div>
            </SectionCard>

            <SectionCard
                step="Step 03 / 04"
                icon={<Briefcase className="h-4.5 w-4.5 text-muted-foreground" />}
                title="Employment Details"
                description="Org structure, employment state, dates, and workplace assignment."
            >
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    <SelectField
                        label="Department"
                        value={form.data.department_id}
                        onChange={(value) => form.setData('department_id', value)}
                        options={departmentOptions}
                        error={form.errors.department_id}
                        placeholder="Select department"
                    />

                    <SelectField
                        label="Job Title"
                        value={form.data.job_title_id}
                        onChange={(value) => form.setData('job_title_id', value)}
                        options={jobTitleOptions}
                        error={form.errors.job_title_id}
                        placeholder="Select job title"
                    />

                    <SelectField
                        label="Employment Status"
                        value={form.data.employment_status}
                        onChange={(value) => form.setData('employment_status', value)}
                        options={employmentStatusOptions}
                        error={form.errors.employment_status}
                        placeholder="Select status"
                    />

                    <SelectField
                        label="Employment Type"
                        value={form.data.employment_type}
                        onChange={(value) => form.setData('employment_type', value)}
                        options={employmentTypeOptions}
                        error={form.errors.employment_type}
                        placeholder="Select type"
                    />

                    <TextField
                        label="Work Location"
                        value={form.data.work_location}
                        onChange={(value) => form.setData('work_location', value)}
                        error={form.errors.work_location}
                    />

                    <DateField
                        label="Hire Date"
                        value={form.data.hire_date}
                        onChange={(value) => form.setData('hire_date', value)}
                        error={form.errors.hire_date}
                    />

                    <DateField
                        label="Probation End Date"
                        value={form.data.probation_end_date}
                        onChange={(value) => form.setData('probation_end_date', value)}
                        error={form.errors.probation_end_date}
                    />

                    <DateField
                        label="Confirmation Date"
                        value={form.data.confirmation_date}
                        onChange={(value) => form.setData('confirmation_date', value)}
                        error={form.errors.confirmation_date}
                    />

                    <DateField
                        label="Review Eligibility Date"
                        value={form.data.review_eligibility_date}
                        onChange={(value) => form.setData('review_eligibility_date', value)}
                        error={form.errors.review_eligibility_date}
                    />
                </div>
            </SectionCard>

            <SectionCard
                step="Step 04 / 04"
                icon={<ShieldCheck className="h-4.5 w-4.5 text-muted-foreground" />}
                title="Performance Setup"
                description="Reporting line, review readiness, activation state, and role setup."
            >
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    <SelectField
                        label="Line Manager"
                        value={form.data.line_manager_user_id}
                        onChange={(value) => form.setData('line_manager_user_id', value)}
                        options={userOptions}
                        error={form.errors.line_manager_user_id}
                        placeholder="Select line manager"
                    />

                    <SelectField
                        label="Approving Manager"
                        value={form.data.approving_manager_user_id}
                        onChange={(value) => form.setData('approving_manager_user_id', value)}
                        options={userOptions}
                        error={form.errors.approving_manager_user_id}
                        placeholder="Select approving manager"
                    />

                    <div className="space-y-2">
                        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Review Eligibility
                        </Label>
                        <CheckboxField
                            label="Review Eligible"
                            checked={form.data.is_review_eligible}
                            onCheckedChange={(checked) => form.setData('is_review_eligible', checked)}
                            error={form.errors.is_review_eligible}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Employee Activity
                        </Label>
                        <CheckboxField
                            label="Active Employee"
                            checked={form.data.is_active}
                            onCheckedChange={(checked) => form.setData('is_active', checked)}
                            error={form.errors.is_active}
                        />
                    </div>

                    {canAssignRoles ? (
                        <div className="space-y-2 xl:col-span-2">
                            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Role Assignment
                            </Label>
                            <div className="rounded-xl border bg-muted/10 p-4">
                                <div className="mb-3 flex items-center gap-2">
                                    <Badge variant="outline">Roles</Badge>
                                    <span className="text-xs text-muted-foreground">
                                        Hold Ctrl / Cmd to select multiple
                                    </span>
                                </div>

                                <select
                                    multiple
                                    className="min-h-36 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    value={form.data.role_ids.map(String)}
                                    onChange={(event) =>
                                        form.setData(
                                            'role_ids',
                                            Array.from(event.target.selectedOptions).map((option) => Number(option.value)),
                                        )
                                    }
                                >
                                    {roleOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>

                                <InputError message={form.errors.role_ids} />
                            </div>
                        </div>
                    ) : null}
                </div>
            </SectionCard>

            <SectionCard
                step="Notes"
                icon={<FileText className="h-4.5 w-4.5 text-muted-foreground" />}
                title="Notes"
                description="Freeform notes relevant to appraisal administration and employee context."
            >
                <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <textarea
                        id="notes"
                        className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={form.data.notes}
                        onChange={(event) => form.setData('notes', event.target.value)}
                    />
                    <InputError message={form.errors.notes} />
                </div>
            </SectionCard>
        </div>
    );
}

function SectionCard({
    step,
    icon,
    title,
    description,
    children,
}: {
    step: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/20">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
                            {icon}
                        </div>

                        <div>
                            <CardTitle className="text-lg">{title}</CardTitle>
                            <CardDescription className="mt-1">{description}</CardDescription>
                        </div>
                    </div>

                    <Badge variant="outline">{step}</Badge>
                </div>
            </CardHeader>

            <CardContent className="p-6">{children}</CardContent>
        </Card>
    );
}

interface FieldProps {
    label: string;
    value: string;
    error?: string;
    className?: string;
}

function TextField({
    label,
    value,
    onChange,
    error,
    className,
}: FieldProps & { onChange: (value: string) => void }) {
    return (
        <div className={`space-y-2 ${className ?? ''}`.trim()}>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</Label>
            <Input value={value} onChange={(event) => onChange(event.target.value)} className="h-11" />
            <InputError message={error} />
        </div>
    );
}

function DateField({
    label,
    value,
    onChange,
    error,
    className,
}: FieldProps & { onChange: (value: string) => void }) {
    return (
        <div className={`space-y-2 ${className ?? ''}`.trim()}>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</Label>
            <Input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="h-11" />
            <InputError message={error} />
        </div>
    );
}

function SelectField({
    label,
    value,
    onChange,
    options,
    error,
    placeholder,
    className,
}: FieldProps & {
    onChange: (value: string) => void;
    options: Option[];
    placeholder: string;
}) {
    return (
        <div className={`space-y-2 ${className ?? ''}`.trim()}>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</Label>
            <select
                className="flex h-11 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <InputError message={error} />
        </div>
    );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</Label>
            <Input value={value} readOnly className="h-11 bg-muted" />
        </div>
    );
}

function CheckboxField({
    label,
    checked,
    onCheckedChange,
    error,
}: {
    label: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    error?: string;
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-lg border bg-muted/10 p-4">
                <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
                <Label className="font-medium">{label}</Label>
            </div>
            <InputError message={error} />
        </div>
    );
}