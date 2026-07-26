import BrandLogo from '@/components/brand-logo';
import EmployeeProfileForm, { type EmployeeProfileSectionKey } from '@/components/performance/employees/EmployeeProfileForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { SharedData } from '@/types';
import type { EmployeeFieldConfigItem, EmployeeProfileFormData, Option } from '@/types/performance';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Briefcase,
    CalendarDays,
    CheckCircle2,
    FilePenLine,
    IdCard,
    Loader2,
    LogOut,
    Mail,
    MapPin,
    Phone,
    Save,
    ShieldCheck,
    UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';

interface Props {
    formDefaults: EmployeeProfileFormData;
    departmentOptions: Option[];
    jobTitleOptions: Option[];
    userOptions: Option[];
    managerOptions: Option[];
    roleOptions: Option[];
    employmentStatusOptions: Option[];
    genderOptions: Option[];
    maritalStatusOptions: Option[];
    employmentTypeOptions: Option[];
    fieldConfig: EmployeeFieldConfigItem[];
    can: { assignRoles: boolean; createDepartment?: boolean; createJobTitle?: boolean };
}

type StepKey = EmployeeProfileSectionKey | 'review';
type ReviewSectionKey = EmployeeProfileSectionKey;

export default function CompleteProfile({
    formDefaults,
    departmentOptions,
    jobTitleOptions,
    userOptions,
    managerOptions,
    roleOptions,
    employmentStatusOptions,
    genderOptions,
    maritalStatusOptions,
    employmentTypeOptions,
    fieldConfig,
    can,
}: Props) {
    const { auth } = usePage<SharedData>().props;
    const draftStorageKey = `employee-profile-complete-draft:${auth.user.id}`;
    const persistedFormDefaults = useMemo(() => {
        if (typeof window === 'undefined') {
            return formDefaults;
        }

        try {
            const rawDraft = window.localStorage.getItem(draftStorageKey);

            if (!rawDraft) {
                return formDefaults;
            }

            const parsedDraft = JSON.parse(rawDraft) as Partial<EmployeeProfileFormData>;

            return {
                ...formDefaults,
                ...parsedDraft,
            };
        } catch {
            return formDefaults;
        }
    }, [draftStorageKey, formDefaults]);
    const form = useForm<EmployeeProfileFormData>(persistedFormDefaults);
    const enabledFormFields = useMemo(
        () => fieldConfig.filter((field) => field.enabled && !['display', 'score', 'history', 'linked_account'].includes(field.input_type)),
        [fieldConfig],
    );
    const stepDefinitions = useMemo(() => {
        const sections = (['identity', 'contact', 'employment', 'performance', 'notes'] as EmployeeProfileSectionKey[])
            .filter((section) => enabledFormFields.some((field) => field.section === section))
            .map((section) => ({
                key: section as StepKey,
                title: sectionTitle(section),
                description: sectionDescription(section),
            }));

        return [
            ...sections,
            { key: 'review' as StepKey, title: 'Review & Confirm', description: 'Review everything and confirm before saving.' },
        ];
    }, [enabledFormFields]);
    const [currentStep, setCurrentStep] = useState<StepKey>(stepDefinitions[0]?.key ?? 'review');
    const [reviewConfirmed, setReviewConfirmed] = useState(false);

    const currentIndex = stepDefinitions.findIndex((step) => step.key === currentStep);
    const currentStepDefinition = stepDefinitions[currentIndex] ?? stepDefinitions[0];
    const isReviewStep = currentStep === 'review';

    useEffect(() => {
        const firstErrorKey = Object.keys(form.errors)[0];

        if (!firstErrorKey) {
            return;
        }

        const errorStep = (fieldConfig.find((field) => field.field_key === firstErrorKey)?.section as EmployeeProfileSectionKey | undefined) ?? 'identity';

        if (errorStep && errorStep !== currentStep) {
            setCurrentStep(errorStep);
        }
    }, [currentStep, fieldConfig, form.errors]);

    useEffect(() => {
        if (!stepDefinitions.some((step) => step.key === currentStep)) {
            setCurrentStep(stepDefinitions[0]?.key ?? 'review');
        }
    }, [currentStep, stepDefinitions]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem(draftStorageKey, JSON.stringify(form.data));
    }, [draftStorageKey, form.data]);

    const reviewSections = useMemo(
        () =>
            (['identity', 'contact', 'employment', 'performance', 'notes'] as ReviewSectionKey[])
                .map((section) => {
                    const rows = enabledFormFields
                        .filter((field) => field.section === section)
                        .map((field) => ({
                            key: field.field_key,
                            label: field.label,
                            required: field.required,
                            value: formatFieldValue(field.field_key, form.data, {
                                authName: auth.user.name,
                                authEmail: auth.user.email,
                                departmentOptions,
                                employmentStatusOptions,
                                employmentTypeOptions,
                                genderOptions,
                                jobTitleOptions,
                                managerOptions,
                                maritalStatusOptions,
                                roleOptions,
                                canAssignRoles: can.assignRoles,
                            }),
                        }));

                    return {
                        key: section,
                        title: sectionTitle(section),
                        rows,
                    };
                })
                .filter((section) => section.rows.length > 0),
        [
            auth.user.email,
            auth.user.name,
            can.assignRoles,
            departmentOptions,
            enabledFormFields,
            employmentStatusOptions,
            employmentTypeOptions,
            form.data,
            genderOptions,
            jobTitleOptions,
            managerOptions,
            maritalStatusOptions,
            roleOptions,
        ],
    );

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!isReviewStep || !reviewConfirmed) {
            return;
        }

        form.post(route('employee-profile.complete.store'), {
            onSuccess: () => {
                if (typeof window !== 'undefined') {
                    window.localStorage.removeItem(draftStorageKey);
                }
            },
        });
    };

    const goToStep = (step: StepKey) => {
        setCurrentStep(step);
    };

    const sectionHasMissingRequiredFields = (sectionKey: ReviewSectionKey) =>
        reviewSections
            .find((section) => section.key === sectionKey)
            ?.rows.some((row) => row.required && !hasFormValue(form.data[row.key as keyof EmployeeProfileFormData])) ?? false;

    const goToPreviousStep = () => {
        if (currentIndex > 0) {
            setCurrentStep(stepDefinitions[currentIndex - 1].key);
        }
    };

    const goToNextStep = () => {
        if (currentIndex < stepDefinitions.length - 1) {
            setCurrentStep(stepDefinitions[currentIndex + 1].key);
        }
    };

    return (
        <>
            <Head title="Complete Employee Profile" />

            {form.processing ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="profile-saving-title"
                    aria-describedby="profile-saving-description"
                    aria-busy="true"
                >
                    <div className="absolute inset-0 bg-background/70 backdrop-blur-md" aria-hidden="true" />
                    <Card className="relative z-10 w-full max-w-md shadow-2xl">
                        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h2 id="profile-saving-title" className="text-lg font-semibold text-foreground">
                                    Saving your profile
                                </h2>
                                <p id="profile-saving-description" className="text-sm leading-6 text-muted-foreground">
                                    Please wait while we save your employee profile and prepare your dashboard.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : null}

            <div className="min-h-svh bg-muted/20">
                <div className="flex min-h-svh w-full flex-col px-3 py-4 sm:px-4 lg:px-6 lg:py-6 xl:px-8">
                    <div className="mb-5 flex flex-col gap-4 rounded-2xl border bg-background/95 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <Link href={route('home')} className="flex h-11 w-11 items-center justify-center rounded-xl border bg-background">
                                <BrandLogo className="size-7 object-contain" iconClassName="size-7 fill-current text-foreground" />
                            </Link>

                            <div className="space-y-1">
                                <Badge variant="secondary" className="w-fit">
                                    First-time setup
                                </Badge>
                                <div className="text-sm font-medium text-foreground">Welcome, {auth.user.name}</div>
                                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                    Complete Employee Profile
                                </h1>
                                <p className="max-w-4xl text-sm text-muted-foreground">
                                    Finish your employee profile before you access the dashboard and the rest of the system.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button asChild variant="outline" size="sm" className="border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground">
                                <Link href={route('home')}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Home
                                </Link>
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
                                onClick={() => router.post(route('logout'))}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </Button>
                        </div>
                    </div>

                    <form onSubmit={submit} className="flex flex-1 flex-col gap-5">
                        <Alert className="border-foreground/10 bg-background/95">
                            <AlertTitle>Profile completion required</AlertTitle>
                            <AlertDescription>
                                Work through each step, then review your details on the final page before saving your
                                profile.
                            </AlertDescription>
                        </Alert>

                        <div className="grid flex-1 gap-5 xl:grid-cols-[minmax(0,1.95fr)_minmax(250px,0.85fr)]">
                            <main className="space-y-5">
                                <div className="rounded-2xl border bg-background p-4 shadow-sm">
                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                                        <div className="space-y-2">
                                            <h2 className="text-xl font-semibold tracking-tight text-foreground">
                                                {currentStepDefinition.title}
                                            </h2>
                                            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                                                {currentStepDefinition.description}
                                            </p>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-3">
                                            <StatCard
                                                icon={<UserRound className="h-4 w-4 text-primary" />}
                                                label="Profile"
                                                value={`${currentIndex + 1} of ${stepDefinitions.length}`}
                                            />
                                            <StatCard
                                                icon={<Briefcase className="h-4 w-4 text-primary" />}
                                                label="Departments"
                                                value={String(departmentOptions.length)}
                                            />
                                            <StatCard
                                                icon={<ShieldCheck className="h-4 w-4 text-primary" />}
                                                label="Job Titles"
                                                value={String(jobTitleOptions.length)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {isReviewStep ? (
                                    <div className="grid gap-4 lg:grid-cols-2">
                                        {reviewSections.map((section) => (
                                            <Card
                                                key={section.key}
                                                className={`shadow-sm ${
                                                    sectionHasMissingRequiredFields(section.key)
                                                        ? 'border-destructive/60 bg-destructive/5'
                                                        : ''
                                                }`}
                                            >
                                                <CardHeader
                                                    className={`flex flex-row items-start justify-between gap-4 space-y-0 border-b p-4 ${
                                                        sectionHasMissingRequiredFields(section.key)
                                                            ? 'border-destructive/35 bg-destructive/10'
                                                            : 'bg-muted/20'
                                                    }`}
                                                >
                                                    <div className="space-y-1">
                                                        <CardTitle
                                                            className={`flex items-center gap-2 text-sm ${
                                                                sectionHasMissingRequiredFields(section.key) ? 'text-destructive' : ''
                                                            }`}
                                                        >
                                                            <span className="flex h-6 w-6 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
                                                                {sectionIcon(section.key)}
                                                            </span>
                                                            {section.title}
                                                        </CardTitle>
                                                        <CardDescription className="text-xs">
                                                            Review these values before you save the profile.
                                                        </CardDescription>
                                                        {sectionHasMissingRequiredFields(section.key) ? (
                                                            <div className="inline-flex items-center gap-1 rounded-md border border-destructive/35 bg-destructive/10 px-2 py-1 text-[11px] font-medium text-destructive">
                                                                <AlertCircle className="h-3.5 w-3.5" />
                                                                Required info missing
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className={`h-8 ${
                                                            sectionHasMissingRequiredFields(section.key)
                                                                ? 'border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground'
                                                                : 'border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground'
                                                        }`}
                                                        onClick={() => goToStep(section.key)}
                                                    >
                                                        <FilePenLine className="mr-1.5 h-3.5 w-3.5" />
                                                        Edit section
                                                    </Button>
                                                </CardHeader>
                                                <CardContent className="space-y-3 p-4">
                                                    {section.rows.map((row) => (
                                                        <div key={row.label} className="grid gap-1 border-b pb-3 last:border-b-0 last:pb-0">
                                                            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                                                {rowIcon(row.label)}
                                                                <span>{row.label}</span>
                                                            </div>
                                                            <div className="text-sm text-foreground">{row.value}</div>
                                                        </div>
                                                    ))}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                        <EmployeeProfileForm
                                            form={form}
                                            mode="edit"
                                            fieldConfig={fieldConfig}
                                            departmentOptions={departmentOptions}
                                            jobTitleOptions={jobTitleOptions}
                                            userOptions={userOptions}
                                        managerOptions={managerOptions}
                                        roleOptions={roleOptions}
                                        employmentStatusOptions={employmentStatusOptions}
                                        genderOptions={genderOptions}
                                        maritalStatusOptions={maritalStatusOptions}
                                        employmentTypeOptions={employmentTypeOptions}
                                        canAssignRoles={can.assignRoles}
                                        canCreateDepartment={can.createDepartment}
                                        canCreateJobTitle={can.createJobTitle}
                                        sectionFilter={[currentStep as EmployeeProfileSectionKey]}
                                    />
                                )}
                            </main>

                            <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
                                <Card className="shadow-sm">
                                    <CardHeader className="p-4">
                                        <CardTitle className="text-base">Completion steps</CardTitle>
                                        <CardDescription className="text-xs">
                                            Steps stay available here while you work through the form.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid gap-2 p-4 pt-0">
                                        {stepDefinitions.map((step, index) => {
                                            const isActive = step.key === currentStep;
                                            const isCompleted = index < currentIndex;

                                            return (
                                                <button
                                                    key={step.key}
                                                    type="button"
                                                    onClick={() => goToStep(step.key)}
                                                    className={`flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                                                        isActive
                                                            ? 'border-primary bg-primary text-primary-foreground'
                                                            : 'border-border bg-background hover:border-primary/50 hover:bg-muted/40'
                                                    }`}
                                                >
                                                    <div
                                                        className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold ${
                                                            isActive
                                                                ? 'border-primary-foreground/35 bg-primary-foreground/15 text-primary-foreground'
                                                                : isCompleted
                                                                  ? 'border-primary bg-primary text-primary-foreground'
                                                                  : 'border-border bg-muted text-foreground'
                                                        }`}
                                                    >
                                                        {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className={`text-sm font-medium ${isActive ? 'text-primary-foreground' : 'text-foreground'}`}>
                                                            {step.title}
                                                        </div>
                                                        <div
                                                            className={`text-xs leading-5 ${
                                                                isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                                                            }`}
                                                        >
                                                            {step.description}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </CardContent>
                                </Card>
                            </aside>
                        </div>

                        <div className="sticky bottom-4 z-10 border-t bg-background/95 px-1 pt-4 backdrop-blur">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                        Step {currentIndex + 1} of {stepDefinitions.length}: {currentStepDefinition.title}
                                    </p>
                                    {isReviewStep ? (
                                        <label
                                            htmlFor="review-confirmed-footer"
                                            className={`flex w-fit cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3 transition-colors ${
                                                reviewConfirmed
                                                    ? 'border-emerald-500 bg-emerald-500/10'
                                                    : 'border-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                                            }`}
                                        >
                                            <Checkbox
                                                id="review-confirmed-footer"
                                                checked={reviewConfirmed}
                                                onCheckedChange={(value) => setReviewConfirmed(value === true)}
                                                className={`mt-0.5 h-5 w-5 border-2 ${
                                                    reviewConfirmed
                                                        ? 'border-emerald-600 data-[state=checked]:bg-emerald-600'
                                                        : 'border-amber-600 bg-background'
                                                }`}
                                            />
                                            <div className="space-y-1">
                                                <span className="block text-sm font-semibold text-foreground">
                                                    Confirm final profile
                                                </span>
                                                <p className={`text-xs leading-5 ${reviewConfirmed ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                                                    {reviewConfirmed
                                                        ? 'Confirmed — you can now save your profile.'
                                                        : 'Tick this box after reviewing all sections to enable saving.'}
                                                </p>
                                            </div>
                                        </label>
                                    ) : null}
                                </div>

                                <div className="flex flex-wrap items-center justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
                                        onClick={goToPreviousStep}
                                        disabled={currentIndex === 0}
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Previous
                                    </Button>

                                    {isReviewStep ? (
                                        <Button type="submit" size="sm" disabled={form.processing || !reviewConfirmed} aria-busy={form.processing}>
                                            {form.processing ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Save className="mr-2 h-4 w-4" />
                                            )}
                                            {form.processing ? 'Saving…' : 'Save Profile'}
                                        </Button>
                                    ) : (
                                        <Button type="button" size="sm" onClick={goToNextStep}>
                                            {currentIndex === stepDefinitions.length - 2 ? 'Review Details' : 'Continue'}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

function StatCard({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value: string;
}) {
    return (
        <Card className="shadow-none">
            <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">{icon}</div>
                <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="text-sm font-semibold text-foreground">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function sectionTitle(section: EmployeeProfileSectionKey) {
    return ({
        identity: 'Identity',
        contact: 'Contact',
        employment: 'Employment',
        performance: 'Performance Setup',
        notes: 'Notes',
    })[section];
}

function sectionDescription(section: EmployeeProfileSectionKey) {
    return ({
        identity: 'Confirm who you are and complete your personal details.',
        contact: 'Add your phone, address, and emergency contact.',
        employment: 'Capture department, title, and employment dates.',
        performance: 'Set managers and performance readiness.',
        notes: 'Add any supporting context relevant to your profile.',
    })[section];
}

function optionLabel(value: number | string | null | undefined, options: Option[]) {
    if (value === null || value === undefined || value === '') {
        return 'Not provided';
    }

    return options.find((option) => String(option.value) === String(value))?.label ?? String(value);
}

function displayValue(value: string | null | undefined) {
    return value && value.trim() !== '' ? value : 'Not provided';
}

function booleanLabel(value: boolean | null | undefined) {
    if (value === true) {
        return 'Yes';
    }

    if (value === false) {
        return 'No';
    }

    return 'Not provided';
}

function formatDate(value: string | null | undefined) {
    if (!value) {
        return 'Not provided';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-ZW', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

function formatFieldValue(
    fieldKey: string,
    formData: EmployeeProfileFormData,
    context: {
        authName: string;
        authEmail: string;
        departmentOptions: Option[];
        employmentStatusOptions: Option[];
        employmentTypeOptions: Option[];
        genderOptions: Option[];
        jobTitleOptions: Option[];
        managerOptions: Option[];
        maritalStatusOptions: Option[];
        roleOptions: Option[];
        canAssignRoles: boolean;
    },
) {
    switch (fieldKey) {
        case 'user_name':
            return context.authName;
        case 'user_email':
            return context.authEmail;
        case 'department_id':
            return optionLabel(formData.department_id, context.departmentOptions);
        case 'job_title_id':
            return optionLabel(formData.job_title_id, context.jobTitleOptions);
        case 'gender':
            return optionLabel(formData.gender, context.genderOptions);
        case 'marital_status':
            return optionLabel(formData.marital_status, context.maritalStatusOptions);
        case 'line_manager_user_id':
        case 'approving_manager_user_id':
            return optionLabel(formData[fieldKey], context.managerOptions);
        case 'employment_status':
            return optionLabel(formData.employment_status, context.employmentStatusOptions);
        case 'employment_type':
            return optionLabel(formData.employment_type, context.employmentTypeOptions);
        case 'is_review_eligible':
        case 'is_active':
            return booleanLabel(Boolean(formData[fieldKey]));
        case 'role_ids':
            return context.canAssignRoles && formData.role_ids.length > 0
                ? context.roleOptions.filter((option) => formData.role_ids.includes(Number(option.value))).map((option) => option.label).join(', ')
                : context.canAssignRoles
                  ? 'No roles selected'
                  : 'Role assignment not available';
        case 'date_of_birth':
        case 'hire_date':
        case 'probation_end_date':
        case 'confirmation_date':
        case 'review_eligibility_date':
            return formatDate(formData[fieldKey]);
        default:
            return displayValue(String(formData[fieldKey as keyof EmployeeProfileFormData] ?? ''));
    }
}

function sectionIcon(sectionKey: EmployeeProfileSectionKey | 'review') {
    if (sectionKey === 'identity') {
        return <UserRound className="h-3.5 w-3.5 text-primary" />;
    }

    if (sectionKey === 'contact') {
        return <MapPin className="h-3.5 w-3.5 text-primary" />;
    }

    if (sectionKey === 'employment') {
        return <Briefcase className="h-3.5 w-3.5 text-primary" />;
    }

    if (sectionKey === 'performance') {
        return <ShieldCheck className="h-3.5 w-3.5 text-primary" />;
    }

    return <FilePenLine className="h-3.5 w-3.5 text-primary" />;
}

function rowIcon(label: string) {
    const normalized = label.toLowerCase();

    if (normalized.includes('email')) {
        return <Mail className="h-3.5 w-3.5" />;
    }

    if (normalized.includes('phone') || normalized.includes('contact')) {
        return <Phone className="h-3.5 w-3.5" />;
    }

    if (normalized.includes('date')) {
        return <CalendarDays className="h-3.5 w-3.5" />;
    }

    if (normalized.includes('id') || normalized.includes('employee number')) {
        return <IdCard className="h-3.5 w-3.5" />;
    }

    if (normalized.includes('department') || normalized.includes('job')) {
        return <Briefcase className="h-3.5 w-3.5" />;
    }

    if (normalized.includes('manager') || normalized.includes('role') || normalized.includes('review') || normalized.includes('active')) {
        return <ShieldCheck className="h-3.5 w-3.5" />;
    }

    if (normalized.includes('address') || normalized.includes('city') || normalized.includes('country') || normalized.includes('postal')) {
        return <MapPin className="h-3.5 w-3.5" />;
    }

    return <UserRound className="h-3.5 w-3.5" />;
}

function hasFormValue(value: EmployeeProfileFormData[keyof EmployeeProfileFormData]) {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }

    if (typeof value === 'number') {
        return true;
    }

    if (typeof value === 'boolean') {
        return true;
    }

    if (Array.isArray(value)) {
        return value.length > 0;
    }

    return value !== null && value !== undefined;
}
