import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { EmployeeProfileFormData, Option } from '@/types/performance';
import type { InertiaFormProps } from '@inertiajs/react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Briefcase, Contact, FileText, ShieldCheck, User2 } from 'lucide-react';

export type EmployeeProfileSectionKey = 'identity' | 'contact' | 'employment' | 'performance' | 'notes';

interface EmployeeProfileFormProps {
    form: InertiaFormProps<EmployeeProfileFormData>;
    mode: 'create' | 'edit';
    departmentOptions: Option[];
    jobTitleOptions: Option[];
    userOptions: Option[];
    managerOptions: Option[];
    roleOptions: Option[];
    employmentStatusOptions: Option[];
    genderOptions: Option[];
    maritalStatusOptions: Option[];
    employmentTypeOptions: Option[];
    canAssignRoles: boolean;
    sectionFilter?: EmployeeProfileSectionKey[];
}

export default function EmployeeProfileForm({
    form,
    mode,
    departmentOptions,
    jobTitleOptions,
    userOptions,
    managerOptions,
    roleOptions,
    employmentStatusOptions,
    genderOptions,
    maritalStatusOptions,
    employmentTypeOptions,
    canAssignRoles,
    sectionFilter,
}: EmployeeProfileFormProps) {
    const selectedUser = userOptions.find((option) => String(option.value) === String(form.data.user_id));
    const shouldRenderSection = (section: EmployeeProfileSectionKey) =>
        !sectionFilter || sectionFilter.includes(section);
    const countryOptions = useMemo<Option[]>(() => buildCountryOptions(), []);
    const phoneCodeOptions = useMemo<Option[]>(() => buildCountryCodeOptions(), []);
    const [personalPhoneCode, setPersonalPhoneCode] = useState('+263');
    const [personalPhoneLocal, setPersonalPhoneLocal] = useState('');
    const [emergencyPhoneCode, setEmergencyPhoneCode] = useState('+263');
    const [emergencyPhoneLocal, setEmergencyPhoneLocal] = useState('');

    useEffect(() => {
        const personalPhone = parsePhoneInput(form.data.personal_phone, phoneCodeOptions);
        const emergencyPhone = parsePhoneInput(form.data.emergency_contact_phone, phoneCodeOptions);

        setPersonalPhoneCode(personalPhone.code || '+263');
        setPersonalPhoneLocal(personalPhone.local);
        setEmergencyPhoneCode(emergencyPhone.code || '+263');
        setEmergencyPhoneLocal(emergencyPhone.local);
    }, [form.data.personal_phone, form.data.emergency_contact_phone, phoneCodeOptions]);

    const updatePersonalPhone = (nextCode: string, nextLocal: string) => {
        setPersonalPhoneCode(nextCode);
        setPersonalPhoneLocal(nextLocal);
        form.setData('personal_phone', composePhoneNumber(nextCode, nextLocal));
    };

    const updateEmergencyPhone = (nextCode: string, nextLocal: string) => {
        setEmergencyPhoneCode(nextCode);
        setEmergencyPhoneLocal(nextLocal);
        form.setData('emergency_contact_phone', composePhoneNumber(nextCode, nextLocal));
    };

    return (
        <div className="space-y-5">
            {shouldRenderSection('identity') ? (
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
            ) : null}

            {shouldRenderSection('contact') ? (
                <SectionCard
                    step="Step 02 / 04"
                    icon={<Contact className="h-4.5 w-4.5 text-muted-foreground" />}
                    title="Contact & Address"
                    description="Home contact information and emergency contact details."
                >
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        <PhoneField
                            label="Personal Phone"
                            countryCode={personalPhoneCode}
                            localNumber={personalPhoneLocal}
                            onCountryCodeChange={(value) => updatePersonalPhone(value, personalPhoneLocal)}
                            onLocalNumberChange={(value) => updatePersonalPhone(personalPhoneCode, value)}
                            codeOptions={phoneCodeOptions}
                            error={form.errors.personal_phone}
                        />

                        <TextField
                            label="Emergency Contact Name"
                            value={form.data.emergency_contact_name}
                            onChange={(value) => form.setData('emergency_contact_name', value)}
                            error={form.errors.emergency_contact_name}
                        />

                        <PhoneField
                            label="Emergency Contact Phone"
                            countryCode={emergencyPhoneCode}
                            localNumber={emergencyPhoneLocal}
                            onCountryCodeChange={(value) => updateEmergencyPhone(value, emergencyPhoneLocal)}
                            onLocalNumberChange={(value) => updateEmergencyPhone(emergencyPhoneCode, value)}
                            codeOptions={phoneCodeOptions}
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

                        <SelectField
                            label="Country"
                            value={form.data.country}
                            onChange={(value) => form.setData('country', value)}
                            options={countryOptions}
                            error={form.errors.country}
                            placeholder="Select country"
                        />
                    </div>
                </SectionCard>
            ) : null}

            {shouldRenderSection('employment') ? (
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
            ) : null}

            {shouldRenderSection('performance') ? (
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
                            options={managerOptions}
                            error={form.errors.line_manager_user_id}
                            placeholder="Select line manager"
                        />

                        <SelectField
                            label="Approving Manager"
                            value={form.data.approving_manager_user_id}
                            onChange={(value) => form.setData('approving_manager_user_id', value)}
                            options={managerOptions}
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
                                            Select one or more system access roles
                                        </span>
                                    </div>

                                    <div className="grid gap-2 md:grid-cols-2">
                                        {roleOptions.map((option) => {
                                            const roleId = Number(option.value);
                                            const checked = form.data.role_ids.includes(roleId);

                                            return (
                                                <label
                                                    key={option.value}
                                                    className="flex cursor-pointer items-center gap-3 rounded-lg border bg-background px-3 py-2 text-sm transition-colors hover:bg-muted/30"
                                                >
                                                    <Checkbox
                                                        checked={checked}
                                                        onCheckedChange={(value) => {
                                                            const isChecked = value === true;
                                                            form.setData(
                                                                'role_ids',
                                                                isChecked
                                                                    ? [...form.data.role_ids, roleId]
                                                                    : form.data.role_ids.filter((currentId) => currentId !== roleId),
                                                            );
                                                        }}
                                                    />
                                                    <span className="font-medium text-foreground">{option.label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>

                                    <InputError message={resolveRoleError(form.errors)} />
                                </div>
                            </div>
                        ) : null}
                    </div>
                </SectionCard>
            ) : null}

            {shouldRenderSection('notes') ? (
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
            ) : null}
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
    icon: ReactNode;
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/20 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border bg-background">
                            {icon}
                        </div>

                        <div>
                            <CardTitle className="text-base">{title}</CardTitle>
                            <CardDescription className="mt-1">{description}</CardDescription>
                        </div>
                    </div>

                    <Badge variant="outline">{step}</Badge>
                </div>
            </CardHeader>

            <CardContent className="p-4">{children}</CardContent>
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
            <Input value={value} onChange={(event) => onChange(event.target.value)} className="h-10" />
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
            <Input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="h-10" />
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
            <Select value={value || '__empty__'} onValueChange={(next) => onChange(next === '__empty__' ? '' : next)}>
                <SelectTrigger className="h-10">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="__empty__">{placeholder}</SelectItem>
                    {options.map((option) => (
                        <SelectItem key={String(option.value)} value={String(option.value)}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <InputError message={error} />
        </div>
    );
}

function PhoneField({
    label,
    countryCode,
    localNumber,
    onCountryCodeChange,
    onLocalNumberChange,
    codeOptions,
    error,
    className,
}: {
    label: string;
    countryCode: string;
    localNumber: string;
    onCountryCodeChange: (value: string) => void;
    onLocalNumberChange: (value: string) => void;
    codeOptions: Option[];
    error?: string;
    className?: string;
}) {
    return (
        <div className={`space-y-2 ${className ?? ''}`.trim()}>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</Label>
            <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-2">
                <Select value={countryCode || '__empty__'} onValueChange={(next) => onCountryCodeChange(next === '__empty__' ? '' : next)}>
                    <SelectTrigger className="h-10">
                        <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__empty__">Code</SelectItem>
                        {codeOptions.map((option) => (
                            <SelectItem key={String(option.value)} value={String(option.value)}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input
                    type="tel"
                    value={localNumber}
                    onChange={(event) => onLocalNumberChange(event.target.value.replace(/[^\d]/g, ''))}
                    className="h-10"
                    placeholder="Phone number"
                />
            </div>
            <InputError message={error} />
        </div>
    );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</Label>
            <Input value={value} readOnly className="h-10 bg-muted" />
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
            <div className="flex items-center gap-3 rounded-lg border bg-muted/10 p-3">
                <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
                <Label className="font-medium">{label}</Label>
            </div>
            <InputError message={error} />
        </div>
    );
}

function resolveRoleError(errors: Partial<Record<string, string | undefined>>) {
    return errors.role_ids ?? Object.entries(errors).find(([key, value]) => key.startsWith('role_ids.') && !!value)?.[1];
}

function buildCountryOptions(): Option[] {
    const countryCodes = [
        'AF', 'AL', 'DZ', 'AO', 'AR', 'AM', 'AU', 'AT', 'AZ', 'BH', 'BD', 'BY', 'BE', 'BJ', 'BO', 'BA', 'BW', 'BR', 'BG', 'BF',
        'BI', 'KH', 'CM', 'CA', 'CF', 'TD', 'CL', 'CN', 'CO', 'KM', 'CG', 'CD', 'CR', 'CI', 'HR', 'CU', 'CY', 'CZ', 'DK', 'DJ',
        'DO', 'EC', 'EG', 'SV', 'GQ', 'ER', 'EE', 'SZ', 'ET', 'FI', 'FR', 'GA', 'GM', 'GE', 'DE', 'GH', 'GR', 'GT', 'GN', 'GW',
        'HT', 'HN', 'HK', 'HU', 'IS', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IL', 'IT', 'JM', 'JP', 'JO', 'KZ', 'KE', 'KR', 'KW', 'KG',
        'LA', 'LV', 'LB', 'LS', 'LR', 'LY', 'LT', 'LU', 'MG', 'MW', 'MY', 'ML', 'MT', 'MR', 'MU', 'MX', 'MD', 'MN', 'ME', 'MA',
        'MZ', 'MM', 'NA', 'NP', 'NL', 'NZ', 'NI', 'NE', 'NG', 'MK', 'NO', 'OM', 'PK', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH', 'PL',
        'PT', 'QA', 'RO', 'RU', 'RW', 'SA', 'SN', 'RS', 'SL', 'SG', 'SK', 'SI', 'SO', 'ZA', 'SS', 'ES', 'LK', 'SD', 'SE', 'CH',
        'SY', 'TW', 'TJ', 'TZ', 'TH', 'TL', 'TG', 'TN', 'TR', 'UG', 'UA', 'AE', 'GB', 'US', 'UY', 'UZ', 'VE', 'VN', 'YE', 'ZM', 'ZW',
    ];

    const displayNames = typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function'
        ? new Intl.DisplayNames(['en'], { type: 'region' })
        : null;

    return countryCodes
        .map((code) => {
            const fallbackName = code;
            const name = displayNames?.of(code) ?? fallbackName;

            return {
                value: name,
                label: name,
            };
        })
        .sort((a, b) => String(a.label).localeCompare(String(b.label)));
}

function buildCountryCodeOptions(): Option[] {
    return [
        { value: '+1', label: '+1 (US/Canada)' },
        { value: '+7', label: '+7 (Kazakhstan/Russia)' },
        { value: '+20', label: '+20 (Egypt)' },
        { value: '+27', label: '+27 (South Africa)' },
        { value: '+30', label: '+30 (Greece)' },
        { value: '+31', label: '+31 (Netherlands)' },
        { value: '+32', label: '+32 (Belgium)' },
        { value: '+33', label: '+33 (France)' },
        { value: '+34', label: '+34 (Spain)' },
        { value: '+36', label: '+36 (Hungary)' },
        { value: '+39', label: '+39 (Italy)' },
        { value: '+40', label: '+40 (Romania)' },
        { value: '+41', label: '+41 (Switzerland)' },
        { value: '+43', label: '+43 (Austria)' },
        { value: '+44', label: '+44 (UK)' },
        { value: '+45', label: '+45 (Denmark)' },
        { value: '+46', label: '+46 (Sweden)' },
        { value: '+47', label: '+47 (Norway)' },
        { value: '+48', label: '+48 (Poland)' },
        { value: '+49', label: '+49 (Germany)' },
        { value: '+52', label: '+52 (Mexico)' },
        { value: '+54', label: '+54 (Argentina)' },
        { value: '+55', label: '+55 (Brazil)' },
        { value: '+60', label: '+60 (Malaysia)' },
        { value: '+61', label: '+61 (Australia)' },
        { value: '+62', label: '+62 (Indonesia)' },
        { value: '+63', label: '+63 (Philippines)' },
        { value: '+64', label: '+64 (New Zealand)' },
        { value: '+65', label: '+65 (Singapore)' },
        { value: '+66', label: '+66 (Thailand)' },
        { value: '+81', label: '+81 (Japan)' },
        { value: '+82', label: '+82 (South Korea)' },
        { value: '+84', label: '+84 (Vietnam)' },
        { value: '+86', label: '+86 (China)' },
        { value: '+90', label: '+90 (Turkey)' },
        { value: '+91', label: '+91 (India)' },
        { value: '+92', label: '+92 (Pakistan)' },
        { value: '+93', label: '+93 (Afghanistan)' },
        { value: '+94', label: '+94 (Sri Lanka)' },
        { value: '+95', label: '+95 (Myanmar)' },
        { value: '+98', label: '+98 (Iran)' },
        { value: '+211', label: '+211 (South Sudan)' },
        { value: '+212', label: '+212 (Morocco)' },
        { value: '+213', label: '+213 (Algeria)' },
        { value: '+216', label: '+216 (Tunisia)' },
        { value: '+218', label: '+218 (Libya)' },
        { value: '+220', label: '+220 (Gambia)' },
        { value: '+221', label: '+221 (Senegal)' },
        { value: '+223', label: '+223 (Mali)' },
        { value: '+225', label: "+225 (Cote d'Ivoire)" },
        { value: '+226', label: '+226 (Burkina Faso)' },
        { value: '+227', label: '+227 (Niger)' },
        { value: '+228', label: '+228 (Togo)' },
        { value: '+229', label: '+229 (Benin)' },
        { value: '+230', label: '+230 (Mauritius)' },
        { value: '+231', label: '+231 (Liberia)' },
        { value: '+232', label: '+232 (Sierra Leone)' },
        { value: '+233', label: '+233 (Ghana)' },
        { value: '+234', label: '+234 (Nigeria)' },
        { value: '+235', label: '+235 (Chad)' },
        { value: '+236', label: '+236 (CAR)' },
        { value: '+237', label: '+237 (Cameroon)' },
        { value: '+238', label: '+238 (Cabo Verde)' },
        { value: '+239', label: '+239 (Sao Tome and Principe)' },
        { value: '+240', label: '+240 (Equatorial Guinea)' },
        { value: '+241', label: '+241 (Gabon)' },
        { value: '+242', label: '+242 (Congo)' },
        { value: '+243', label: '+243 (DR Congo)' },
        { value: '+244', label: '+244 (Angola)' },
        { value: '+245', label: '+245 (Guinea-Bissau)' },
        { value: '+248', label: '+248 (Seychelles)' },
        { value: '+249', label: '+249 (Sudan)' },
        { value: '+250', label: '+250 (Rwanda)' },
        { value: '+251', label: '+251 (Ethiopia)' },
        { value: '+252', label: '+252 (Somalia)' },
        { value: '+253', label: '+253 (Djibouti)' },
        { value: '+254', label: '+254 (Kenya)' },
        { value: '+255', label: '+255 (Tanzania)' },
        { value: '+256', label: '+256 (Uganda)' },
        { value: '+257', label: '+257 (Burundi)' },
        { value: '+258', label: '+258 (Mozambique)' },
        { value: '+260', label: '+260 (Zambia)' },
        { value: '+261', label: '+261 (Madagascar)' },
        { value: '+262', label: '+262 (Reunion)' },
        { value: '+263', label: '+263 (Zimbabwe)' },
        { value: '+264', label: '+264 (Namibia)' },
        { value: '+265', label: '+265 (Malawi)' },
        { value: '+266', label: '+266 (Lesotho)' },
        { value: '+267', label: '+267 (Botswana)' },
        { value: '+268', label: '+268 (Eswatini)' },
        { value: '+269', label: '+269 (Comoros)' },
        { value: '+351', label: '+351 (Portugal)' },
        { value: '+352', label: '+352 (Luxembourg)' },
        { value: '+353', label: '+353 (Ireland)' },
        { value: '+354', label: '+354 (Iceland)' },
        { value: '+355', label: '+355 (Albania)' },
        { value: '+356', label: '+356 (Malta)' },
        { value: '+357', label: '+357 (Cyprus)' },
        { value: '+358', label: '+358 (Finland)' },
        { value: '+359', label: '+359 (Bulgaria)' },
        { value: '+370', label: '+370 (Lithuania)' },
        { value: '+371', label: '+371 (Latvia)' },
        { value: '+372', label: '+372 (Estonia)' },
        { value: '+380', label: '+380 (Ukraine)' },
        { value: '+381', label: '+381 (Serbia)' },
        { value: '+385', label: '+385 (Croatia)' },
        { value: '+386', label: '+386 (Slovenia)' },
        { value: '+420', label: '+420 (Czechia)' },
        { value: '+421', label: '+421 (Slovakia)' },
        { value: '+880', label: '+880 (Bangladesh)' },
        { value: '+961', label: '+961 (Lebanon)' },
        { value: '+962', label: '+962 (Jordan)' },
        { value: '+963', label: '+963 (Syria)' },
        { value: '+964', label: '+964 (Iraq)' },
        { value: '+965', label: '+965 (Kuwait)' },
        { value: '+966', label: '+966 (Saudi Arabia)' },
        { value: '+967', label: '+967 (Yemen)' },
        { value: '+968', label: '+968 (Oman)' },
        { value: '+971', label: '+971 (UAE)' },
        { value: '+972', label: '+972 (Israel)' },
        { value: '+973', label: '+973 (Bahrain)' },
        { value: '+974', label: '+974 (Qatar)' },
        { value: '+975', label: '+975 (Bhutan)' },
        { value: '+976', label: '+976 (Mongolia)' },
        { value: '+977', label: '+977 (Nepal)' },
        { value: '+992', label: '+992 (Tajikistan)' },
        { value: '+994', label: '+994 (Azerbaijan)' },
        { value: '+995', label: '+995 (Georgia)' },
        { value: '+998', label: '+998 (Uzbekistan)' },
    ];
}

function parsePhoneInput(input: string, codeOptions: Option[]): { code: string; local: string } {
    if (!input) {
        return { code: '', local: '' };
    }

    const normalized = input.trim().replace(/\s+/g, '');

    if (!normalized.startsWith('+')) {
        return { code: '', local: normalized.replace(/[^\d]/g, '') };
    }

    const sortedCodes = codeOptions
        .map((option) => String(option.value))
        .sort((a, b) => b.length - a.length);
    const matchedCode = sortedCodes.find((code) => normalized.startsWith(code));

    if (!matchedCode) {
        return { code: '', local: normalized.replace(/[^\d]/g, '') };
    }

    return {
        code: matchedCode,
        local: normalized.slice(matchedCode.length).replace(/[^\d]/g, ''),
    };
}

function composePhoneNumber(code: string, local: string): string {
    const normalizedLocal = local.replace(/[^\d]/g, '');
    const normalizedCode = code.trim();

    if (!normalizedLocal) {
        return '';
    }

    if (!normalizedCode) {
        return normalizedLocal;
    }

    return `${normalizedCode}${normalizedLocal}`;
}
