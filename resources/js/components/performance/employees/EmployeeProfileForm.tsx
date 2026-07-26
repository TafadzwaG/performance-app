import InputError from '@/components/input-error';
import CreatableOptionSelect from '@/components/performance/setup/CreatableOptionSelect';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { EmployeeFieldConfigItem, EmployeeProfileFormData, Option } from '@/types/performance';
import type { InertiaFormProps } from '@inertiajs/react';
import { Briefcase, Contact, FileText, ShieldCheck, User2 } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

export type EmployeeProfileSectionKey = 'identity' | 'contact' | 'employment' | 'performance' | 'notes';

interface EmployeeProfileFormProps {
    form: InertiaFormProps<EmployeeProfileFormData>;
    mode: 'create' | 'edit';
    fieldConfig: EmployeeFieldConfigItem[];
    departmentOptions: Option[];
    locationOptions?: Option[];
    jobTitleOptions: Option[];
    userOptions: Option[];
    managerOptions: Option[];
    roleOptions: Option[];
    employmentStatusOptions: Option[];
    genderOptions: Option[];
    maritalStatusOptions: Option[];
    employmentTypeOptions: Option[];
    canAssignRoles: boolean;
    canCreateDepartment?: boolean;
    canCreateJobTitle?: boolean;
    sectionFilter?: EmployeeProfileSectionKey[];
}

const sectionMeta: Record<EmployeeProfileSectionKey, { title: string; description: string; icon: ReactNode }> = {
    identity: {
        title: 'Identity',
        description: 'Core employee identity and personal details used across performance records.',
        icon: <User2 className="h-4.5 w-4.5 text-muted-foreground" />,
    },
    contact: {
        title: 'Contact & Address',
        description: 'Home contact information and emergency contact details.',
        icon: <Contact className="h-4.5 w-4.5 text-muted-foreground" />,
    },
    employment: {
        title: 'Employment Details',
        description: 'Org structure, employment state, dates, and workplace assignment.',
        icon: <Briefcase className="h-4.5 w-4.5 text-muted-foreground" />,
    },
    performance: {
        title: 'Performance Setup',
        description: 'Reporting line, review readiness, activation state, and role setup.',
        icon: <ShieldCheck className="h-4.5 w-4.5 text-muted-foreground" />,
    },
    notes: {
        title: 'Notes',
        description: 'Freeform notes relevant to appraisal administration and employee context.',
        icon: <FileText className="h-4.5 w-4.5 text-muted-foreground" />,
    },
};

export default function EmployeeProfileForm({
    form,
    mode,
    fieldConfig,
    departmentOptions,
    locationOptions = [],
    jobTitleOptions,
    userOptions,
    managerOptions,
    roleOptions,
    employmentStatusOptions,
    genderOptions,
    maritalStatusOptions,
    employmentTypeOptions,
    canAssignRoles,
    canCreateDepartment = false,
    canCreateJobTitle = false,
    sectionFilter,
}: EmployeeProfileFormProps) {
    const selectedUser = userOptions.find((option) => String(option.value) === String(form.data.user_id));
    const countryOptions = useMemo<Option[]>(() => buildCountryOptions(), []);
    const phoneCodeOptions = useMemo<Option[]>(() => buildCountryCodeOptions(), []);
    const [departmentList, setDepartmentList] = useState(departmentOptions);
    const [jobTitleList, setJobTitleList] = useState(jobTitleOptions);
    const [personalPhoneCode, setPersonalPhoneCode] = useState('+263');
    const [personalPhoneLocal, setPersonalPhoneLocal] = useState('');
    const [emergencyPhoneCode, setEmergencyPhoneCode] = useState('+263');
    const [emergencyPhoneLocal, setEmergencyPhoneLocal] = useState('');

    useEffect(() => {
        setDepartmentList(departmentOptions);
    }, [departmentOptions]);

    useEffect(() => {
        setJobTitleList(jobTitleOptions);
    }, [jobTitleOptions]);

    useEffect(() => {
        const personalPhone = parsePhoneInput(form.data.personal_phone, phoneCodeOptions);
        const emergencyPhone = parsePhoneInput(form.data.emergency_contact_phone, phoneCodeOptions);
        setPersonalPhoneCode(personalPhone.code || '+263');
        setPersonalPhoneLocal(personalPhone.local);
        setEmergencyPhoneCode(emergencyPhone.code || '+263');
        setEmergencyPhoneLocal(emergencyPhone.local);
    }, [form.data.personal_phone, form.data.emergency_contact_phone, phoneCodeOptions]);

    const visibleFields = fieldConfig
        .filter((field) => field.enabled)
        .filter((field) => !sectionFilter || sectionFilter.includes(field.section as EmployeeProfileSectionKey))
        .filter((field) => field.input_type !== 'display' && field.input_type !== 'score' && field.input_type !== 'history' && field.input_type !== 'linked_account');

    const visibleSections = (['identity', 'contact', 'employment', 'performance', 'notes'] as EmployeeProfileSectionKey[])
        .filter((section) => visibleFields.some((field) => field.section === section));

    const optionMap: Record<string, Option[]> = {
        departmentOptions: departmentList,
        locationOptions,
        jobTitleOptions: jobTitleList,
        userOptions,
        managerOptions,
        roleOptions,
        employmentStatusOptions,
        genderOptions,
        maritalStatusOptions,
        employmentTypeOptions,
        countryOptions,
    };

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
            {visibleSections.map((section, index) => {
                const fields = visibleFields.filter((field) => field.section === section);

                if (fields.length === 0) {
                    return null;
                }

                return (
                    <SectionCard
                        key={section}
                        step={`Step ${String(index + 1).padStart(2, '0')}`}
                        icon={sectionMeta[section].icon}
                        title={sectionMeta[section].title}
                        description={sectionMeta[section].description}
                    >
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {fields.map((field) => {
                                if (field.field_key === 'role_ids' && !canAssignRoles) {
                                    return null;
                                }

                                if (field.input_type === 'roles') {
                                    return (
                                        <RoleAssignmentField
                                            key={field.field_key}
                                            roleOptions={roleOptions}
                                            selectedRoleIds={form.data.role_ids}
                                            onChange={(roleIds) => form.setData('role_ids', roleIds)}
                                            error={resolveRoleError(form.errors)}
                                        />
                                    );
                                }

                                if (field.input_type === 'phone') {
                                    const phoneState = field.field_key === 'personal_phone'
                                        ? {
                                              code: personalPhoneCode,
                                              local: personalPhoneLocal,
                                              onCodeChange: (value: string) => updatePersonalPhone(value, personalPhoneLocal),
                                              onLocalChange: (value: string) => updatePersonalPhone(personalPhoneCode, value),
                                          }
                                        : {
                                              code: emergencyPhoneCode,
                                              local: emergencyPhoneLocal,
                                              onCodeChange: (value: string) => updateEmergencyPhone(value, emergencyPhoneLocal),
                                              onLocalChange: (value: string) => updateEmergencyPhone(emergencyPhoneCode, value),
                                          };

                                    return (
                                        <PhoneField
                                            key={field.field_key}
                                            label={field.label}
                                            required={field.required}
                                            countryCode={phoneState.code}
                                            localNumber={phoneState.local}
                                            onCountryCodeChange={phoneState.onCodeChange}
                                            onLocalNumberChange={phoneState.onLocalChange}
                                            codeOptions={phoneCodeOptions}
                                            error={form.errors[field.field_key as keyof typeof form.errors] as string | undefined}
                                        />
                                    );
                                }

                                if (field.field_key === 'user_id' && mode === 'edit') {
                                    return <ReadOnlyField key={field.field_key} label={field.label} value={selectedUser?.label ?? 'Unknown user'} />;
                                }

                                if (field.input_type === 'checkbox') {
                                    return (
                                        <CheckboxField
                                            key={field.field_key}
                                            label={field.label}
                                            required={field.required}
                                            checked={Boolean(form.data[field.field_key as keyof EmployeeProfileFormData])}
                                            onCheckedChange={(checked) => form.setData(field.field_key as keyof EmployeeProfileFormData, checked)}
                                            error={form.errors[field.field_key as keyof typeof form.errors] as string | undefined}
                                        />
                                    );
                                }

                                if (field.input_type === 'select') {
                                    const options = optionMap[field.options_key ?? ''] ?? [];

                                    if (field.field_key === 'department_id') {
                                        return (
                                            <CreatableOptionSelect
                                                key={field.field_key}
                                                label={field.label}
                                                required={field.required}
                                                value={String(form.data.department_id ?? '')}
                                                onChange={(value) => form.setData('department_id', value)}
                                                options={departmentList}
                                                onOptionCreated={(option) =>
                                                    setDepartmentList((current) =>
                                                        [...current, option].sort((left, right) => left.label.localeCompare(right.label)),
                                                    )
                                                }
                                                error={form.errors.department_id}
                                                placeholder="Select department"
                                                canCreate={canCreateDepartment}
                                                entityType="department"
                                            />
                                        );
                                    }

                                    if (field.field_key === 'job_title_id') {
                                        return (
                                            <CreatableOptionSelect
                                                key={field.field_key}
                                                label={field.label}
                                                required={field.required}
                                                value={String(form.data.job_title_id ?? '')}
                                                onChange={(value) => form.setData('job_title_id', value)}
                                                options={jobTitleList}
                                                onOptionCreated={(option) =>
                                                    setJobTitleList((current) =>
                                                        [...current, option].sort((left, right) => left.label.localeCompare(right.label)),
                                                    )
                                                }
                                                error={form.errors.job_title_id}
                                                placeholder="Select job title"
                                                canCreate={canCreateJobTitle}
                                                entityType="job_title"
                                            />
                                        );
                                    }

                                    return (
                                        <SelectField
                                            key={field.field_key}
                                            label={field.label}
                                            required={field.required}
                                            value={String(form.data[field.field_key as keyof EmployeeProfileFormData] ?? '')}
                                            onChange={(value) => form.setData(field.field_key as keyof EmployeeProfileFormData, value)}
                                            options={options}
                                            error={form.errors[field.field_key as keyof typeof form.errors] as string | undefined}
                                            placeholder={`Select ${field.label.toLowerCase()}`}
                                        />
                                    );
                                }

                                if (field.input_type === 'textarea') {
                                    return (
                                        <TextAreaField
                                            key={field.field_key}
                                            label={field.label}
                                            required={field.required}
                                            value={String(form.data[field.field_key as keyof EmployeeProfileFormData] ?? '')}
                                            onChange={(value) => form.setData(field.field_key as keyof EmployeeProfileFormData, value)}
                                            error={form.errors[field.field_key as keyof typeof form.errors] as string | undefined}
                                            className="xl:col-span-3"
                                        />
                                    );
                                }

                                if (field.input_type === 'date') {
                                    return (
                                        <DateField
                                            key={field.field_key}
                                            label={field.label}
                                            required={field.required}
                                            value={String(form.data[field.field_key as keyof EmployeeProfileFormData] ?? '')}
                                            onChange={(value) => form.setData(field.field_key as keyof EmployeeProfileFormData, value)}
                                            error={form.errors[field.field_key as keyof typeof form.errors] as string | undefined}
                                        />
                                    );
                                }

                                return (
                                    <TextField
                                        key={field.field_key}
                                        label={field.label}
                                        required={field.required}
                                        value={String(form.data[field.field_key as keyof EmployeeProfileFormData] ?? '')}
                                        onChange={(value) => form.setData(field.field_key as keyof EmployeeProfileFormData, value)}
                                        error={form.errors[field.field_key as keyof typeof form.errors] as string | undefined}
                                    />
                                );
                            })}
                        </div>
                    </SectionCard>
                );
            })}
        </div>
    );
}

function SectionCard({ step, icon, title, description, children }: { step: string; icon: ReactNode; title: string; description: string; children: ReactNode }) {
    return (
        <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/20 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border bg-background">{icon}</div>
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

function TextField({ label, required, value, onChange, error, className }: { label: string; required?: boolean; value: string; onChange: (value: string) => void; error?: string; className?: string }) {
    return (
        <div className={`space-y-2 ${className ?? ''}`.trim()}>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}{required ? ' *' : ''}</Label>
            <Input value={value} onChange={(event) => onChange(event.target.value)} className="h-10" />
            <InputError message={error} />
        </div>
    );
}

function DateField({ label, required, value, onChange, error, className }: { label: string; required?: boolean; value: string; onChange: (value: string) => void; error?: string; className?: string }) {
    return (
        <div className={`space-y-2 ${className ?? ''}`.trim()}>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}{required ? ' *' : ''}</Label>
            <Input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="h-10" />
            <InputError message={error} />
        </div>
    );
}

function TextAreaField({ label, required, value, onChange, error, className }: { label: string; required?: boolean; value: string; onChange: (value: string) => void; error?: string; className?: string }) {
    return (
        <div className={`space-y-2 ${className ?? ''}`.trim()}>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}{required ? ' *' : ''}</Label>
            <textarea className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm" value={value} onChange={(event) => onChange(event.target.value)} />
            <InputError message={error} />
        </div>
    );
}

function SelectField({ label, required, value, onChange, options, error, placeholder, className }: { label: string; required?: boolean; value: string; onChange: (value: string) => void; options: Option[]; error?: string; placeholder: string; className?: string }) {
    return (
        <div className={`space-y-2 ${className ?? ''}`.trim()}>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}{required ? ' *' : ''}</Label>
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

function PhoneField({ label, required, countryCode, localNumber, onCountryCodeChange, onLocalNumberChange, codeOptions, error, className }: { label: string; required?: boolean; countryCode: string; localNumber: string; onCountryCodeChange: (value: string) => void; onLocalNumberChange: (value: string) => void; codeOptions: Option[]; error?: string; className?: string }) {
    return (
        <div className={`space-y-2 ${className ?? ''}`.trim()}>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}{required ? ' *' : ''}</Label>
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
                <Input type="tel" value={localNumber} onChange={(event) => onLocalNumberChange(event.target.value.replace(/[^\d]/g, ''))} className="h-10" placeholder="Phone number" />
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

function CheckboxField({ label, required, checked, onCheckedChange, error }: { label: string; required?: boolean; checked: boolean; onCheckedChange: (checked: boolean) => void; error?: string }) {
    return (
        <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}{required ? ' *' : ''}</Label>
            <div className="flex items-center gap-3 rounded-lg border bg-muted/10 p-3">
                <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
                <Label className="font-medium">{label}</Label>
            </div>
            <InputError message={error} />
        </div>
    );
}

function RoleAssignmentField({ roleOptions, selectedRoleIds, onChange, error }: { roleOptions: Option[]; selectedRoleIds: number[]; onChange: (roleIds: number[]) => void; error?: string }) {
    return (
        <div className="space-y-2 xl:col-span-2">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Role Assignment</Label>
            <div className="rounded-xl border bg-muted/10 p-4">
                <div className="mb-3 flex items-center gap-2">
                    <Badge variant="outline">Roles</Badge>
                    <span className="text-xs text-muted-foreground">Select one or more system access roles</span>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                    {roleOptions.map((option) => {
                        const roleId = Number(option.value);
                        const checked = selectedRoleIds.includes(roleId);

                        return (
                            <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-lg border bg-background px-3 py-2 text-sm transition-colors hover:bg-muted/30">
                                <Checkbox
                                    checked={checked}
                                    onCheckedChange={(value) => {
                                        const isChecked = value === true;
                                        onChange(isChecked ? [...selectedRoleIds, roleId] : selectedRoleIds.filter((currentId) => currentId !== roleId));
                                    }}
                                />
                                <span className="font-medium text-foreground">{option.label}</span>
                            </label>
                        );
                    })}
                </div>
                <InputError message={error} />
            </div>
        </div>
    );
}

function resolveRoleError(errors: Partial<Record<string, string | undefined>>) {
    return errors.role_ids ?? Object.entries(errors).find(([key, value]) => key.startsWith('role_ids.') && !!value)?.[1];
}

function buildCountryOptions(): Option[] {
    const countryCodes = ['AF', 'AL', 'DZ', 'AO', 'AR', 'AM', 'AU', 'AT', 'AZ', 'BH', 'BD', 'BY', 'BE', 'BJ', 'BO', 'BA', 'BW', 'BR', 'BG', 'BF', 'BI', 'KH', 'CM', 'CA', 'CF', 'TD', 'CL', 'CN', 'CO', 'KM', 'CG', 'CD', 'CR', 'CI', 'HR', 'CU', 'CY', 'CZ', 'DK', 'DJ', 'DO', 'EC', 'EG', 'SV', 'GQ', 'ER', 'EE', 'SZ', 'ET', 'FI', 'FR', 'GA', 'GM', 'GE', 'DE', 'GH', 'GR', 'GT', 'GN', 'GW', 'HT', 'HN', 'HK', 'HU', 'IS', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IL', 'IT', 'JM', 'JP', 'JO', 'KZ', 'KE', 'KR', 'KW', 'KG', 'LA', 'LV', 'LB', 'LS', 'LR', 'LY', 'LT', 'LU', 'MG', 'MW', 'MY', 'ML', 'MT', 'MR', 'MU', 'MX', 'MD', 'MN', 'ME', 'MA', 'MZ', 'MM', 'NA', 'NP', 'NL', 'NZ', 'NI', 'NE', 'NG', 'MK', 'NO', 'OM', 'PK', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH', 'PL', 'PT', 'QA', 'RO', 'RU', 'RW', 'SA', 'SN', 'RS', 'SL', 'SG', 'SK', 'SI', 'SO', 'ZA', 'SS', 'ES', 'LK', 'SD', 'SE', 'CH', 'SY', 'TW', 'TJ', 'TZ', 'TH', 'TL', 'TG', 'TN', 'TR', 'UG', 'UA', 'AE', 'GB', 'US', 'UY', 'UZ', 'VE', 'VN', 'YE', 'ZM', 'ZW'];
    const displayNames = typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;

    return countryCodes
        .map((code) => {
            const name = displayNames?.of(code) ?? code;
            return { value: name, label: name };
        })
        .sort((a, b) => String(a.label).localeCompare(String(b.label)));
}

function buildCountryCodeOptions(): Option[] {
    return [
        { value: '+27', label: '+27 (South Africa)' },
        { value: '+263', label: '+263 (Zimbabwe)' },
        { value: '+260', label: '+260 (Zambia)' },
        { value: '+267', label: '+267 (Botswana)' },
        { value: '+268', label: '+268 (Eswatini)' },
        { value: '+265', label: '+265 (Malawi)' },
        { value: '+254', label: '+254 (Kenya)' },
        { value: '+255', label: '+255 (Tanzania)' },
        { value: '+256', label: '+256 (Uganda)' },
        { value: '+1', label: '+1 (US/Canada)' },
        { value: '+44', label: '+44 (UK)' },
    ];
}

function parsePhoneInput(input: string, codeOptions: Option[]): { code: string; local: string } {
    if (!input) return { code: '', local: '' };
    const normalized = input.trim().replace(/\s+/g, '');
    if (!normalized.startsWith('+')) return { code: '', local: normalized.replace(/[^\d]/g, '') };
    const matchedCode = codeOptions.map((option) => String(option.value)).sort((a, b) => b.length - a.length).find((code) => normalized.startsWith(code));
    if (!matchedCode) return { code: '', local: normalized.replace(/[^\d]/g, '') };

    return {
        code: matchedCode,
        local: normalized.slice(matchedCode.length).replace(/[^\d]/g, ''),
    };
}

function composePhoneNumber(code: string, local: string): string {
    const normalizedLocal = local.replace(/[^\d]/g, '');
    if (!normalizedLocal) return '';
    return code.trim() ? `${code.trim()}${normalizedLocal}` : normalizedLocal;
}
