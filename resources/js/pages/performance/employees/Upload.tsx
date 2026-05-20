import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Download, FileSpreadsheet, Plus, ShieldCheck, UploadCloud } from 'lucide-react';
import type { FormEvent } from 'react';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface ImportEmployeesFormData {
    file: File | null;
    [key: string]: File | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Employees', href: route('performance.employees.index') },
    { title: 'Upload', href: route('performance.employees.upload') },
];

const templateColumns =
    'user_email, employee_number, department_name, job_title_name, line_manager_email, approving_manager_email, national_id, date_of_birth, gender, marital_status, personal_phone, employment_status, employment_type, work_location, hire_date, is_active, is_review_eligible, role_names';

export default function EmployeeUpload() {
    const { data, setData, post, processing, errors } = useForm<ImportEmployeesFormData>({
        file: null,
    });

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const [firstFile] = acceptedFiles;

            if (firstFile) {
                setData('file', firstFile);
            }
        },
        [setData],
    );

    const dropzone = useDropzone({
        onDrop,
        multiple: false,
        maxSize: 10 * 1024 * 1024,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.oasis.opendocument.spreadsheet': ['.ods'],
        },
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('performance.employees.upload.preview'), {
            forceFormData: true,
        });
    };

    return (
        <PerformancePage
            title="Upload Employees"
            description="Bulk-create employee profiles from a spreadsheet for users who already exist in the system."
            breadcrumbs={breadcrumbs}
            secondaryActions={
                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                        <Link href={route('performance.employees.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Single Employee
                        </Link>
                    </Button>
                    <Button asChild variant="info">
                        <a href={route('performance.employees.upload.template')}>
                            <Download className="mr-2 h-4 w-4" />
                            Download Template
                        </a>
                    </Button>
                </div>
            }
        >
            <form onSubmit={submit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                            Spreadsheet Upload
                        </CardDescription>
                        <CardTitle>Employee Import File</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div
                            {...dropzone.getRootProps()}
                            className={`cursor-pointer rounded-lg border border-dashed px-5 py-8 transition-colors ${
                                dropzone.isDragActive ? 'border-foreground bg-muted/40' : 'border-muted-foreground/40 bg-muted/20'
                            }`}
                        >
                            <input {...dropzone.getInputProps()} />
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="rounded-lg border bg-background p-3 text-foreground">
                                    <UploadCloud className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-foreground">
                                        {data.file ? data.file.name : 'Drag and drop your file here, or click to browse'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Accepted formats: CSV, XLSX, and ODS (max 10MB)</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Or choose a file</label>
                            <Input
                                type="file"
                                accept=".csv,.xlsx,.ods"
                                onChange={(event) => setData('file', event.target.files?.[0] ?? null)}
                            />
                        </div>

                        {errors.file ? (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                                {Array.isArray(errors.file) ? (
                                    <ul className="list-disc space-y-1 pl-5">
                                        {errors.file.map((message) => (
                                            <li key={message}>{message}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>{errors.file}</p>
                                )}
                            </div>
                        ) : null}

                        <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                            <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                                <FileSpreadsheet className="h-4 w-4" />
                                Template columns
                            </div>
                            <p>{templateColumns}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                            Import Rules
                        </CardDescription>
                        <CardTitle>Before You Upload</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <div className="rounded-lg border px-4 py-3">
                            Each row must reference an existing user account via <span className="font-medium text-foreground">user_email</span>.
                            Create users first under Access → Users if needed.
                        </div>
                        <div className="rounded-lg border px-4 py-3">
                            After upload, you will match <span className="font-medium text-foreground">department_name</span> and{' '}
                            <span className="font-medium text-foreground">job_title_name</span> values to setup records before importing.
                        </div>
                        <div className="rounded-lg border px-4 py-3">
                            Manager emails must match existing user accounts. Leave blank when not applicable.
                        </div>
                        <div className="rounded-lg border px-4 py-3">
                            Optional <span className="font-medium text-foreground">role_names</span> accepts comma-separated role names (e.g. Employee, Manager).
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button asChild type="button" variant="outline">
                        <Link href={route('performance.employees.index')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Cancel
                        </Link>
                    </Button>
                    <Button type="submit" variant="default" disabled={processing || !data.file}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        {processing ? 'Analyzing…' : 'Continue to Matching'}
                    </Button>
                </div>
            </form>
        </PerformancePage>
    );
}
