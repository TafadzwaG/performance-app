import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';
import type { Option } from '@/types/performance';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Building2, Briefcase, CheckCheck, ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';

interface MappingItem {
    source: string;
    row_count: number;
    matched_id: number | null;
    matched_label: string | null;
}

interface PreviewPayload {
    row_count: number;
    departments: MappingItem[];
    job_titles: MappingItem[];
    row_errors: string[];
    sample_rows: Array<{
        line: number;
        user_email: string;
        employee_number: string;
        department_name: string;
        job_title_name: string;
    }>;
}

interface Props {
    preview: PreviewPayload;
    departmentOptions: Option[];
    jobTitleOptions: Option[];
}

type DepartmentMappingRow = { source: string; department_id: string };
type JobTitleMappingRow = { source: string; job_title_id: string };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Employees', href: route('performance.employees.index') },
    { title: 'Upload', href: route('performance.employees.upload') },
    { title: 'Match Setup', href: route('performance.employees.upload.preview') },
];

function initialMappings(items: MappingItem[], idKey: 'department_id' | 'job_title_id'): Array<Record<string, string>> {
    return items.map((item) => ({
        source: item.source,
        [idKey]: item.matched_id ? String(item.matched_id) : '',
    }));
}

export default function EmployeeUploadPreview({ preview, departmentOptions, jobTitleOptions }: Props) {
    const { data, setData, post, processing, errors } = useForm<{
        department_mappings: DepartmentMappingRow[];
        job_title_mappings: JobTitleMappingRow[];
    }>({
        department_mappings: initialMappings(preview.departments, 'department_id') as DepartmentMappingRow[],
        job_title_mappings: initialMappings(preview.job_titles, 'job_title_id') as JobTitleMappingRow[],
    });

    const unmappedDepartments = useMemo(
        () => data.department_mappings.filter((row) => !row.department_id).length,
        [data.department_mappings],
    );
    const unmappedJobTitles = useMemo(
        () => data.job_title_mappings.filter((row) => !row.job_title_id).length,
        [data.job_title_mappings],
    );

    const canImport = unmappedDepartments === 0 && unmappedJobTitles === 0 && preview.row_errors.length === 0;

    const updateDepartmentMapping = (index: number, departmentId: string) => {
        const next = [...data.department_mappings];
        next[index] = { ...next[index], department_id: departmentId };
        setData('department_mappings', next);
    };

    const updateJobTitleMapping = (index: number, jobTitleId: string) => {
        const next = [...data.job_title_mappings];
        next[index] = { ...next[index], job_title_id: jobTitleId };
        setData('job_title_mappings', next);
    };

    const submitImport = () => {
        post(route('performance.employees.upload.store'));
    };

    return (
        <PerformancePage
            title="Match Departments & Job Titles"
            description="Review values from your spreadsheet and map them to setup records before importing employees."
            breadcrumbs={breadcrumbs}
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                            Import Summary
                        </CardDescription>
                        <CardTitle>{preview.row_count} employee rows ready</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                        <Badge variant="secondary">{preview.departments.length} department values</Badge>
                        <Badge variant="secondary">{preview.job_titles.length} job title values</Badge>
                        {unmappedDepartments > 0 ? (
                            <Badge variant="destructive">{unmappedDepartments} departments need mapping</Badge>
                        ) : (
                            <Badge variant="outline" className="border-success/40 text-success">
                                All departments mapped
                            </Badge>
                        )}
                        {unmappedJobTitles > 0 ? (
                            <Badge variant="destructive">{unmappedJobTitles} job titles need mapping</Badge>
                        ) : (
                            <Badge variant="outline" className="border-success/40 text-success">
                                All job titles mapped
                            </Badge>
                        )}
                    </CardContent>
                </Card>

                {preview.row_errors.length > 0 ? (
                    <Card className="border-destructive/30">
                        <CardHeader>
                            <CardTitle className="text-destructive">Rows that need attention</CardTitle>
                            <CardDescription>Fix these in your spreadsheet and upload again.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc space-y-1 pl-5 text-sm text-destructive">
                                {preview.row_errors.map((message) => (
                                    <li key={message}>{message}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ) : null}

                <div className="grid gap-6 xl:grid-cols-2">
                    <MappingCard
                        title="Departments"
                        description="Match each department value from your file to a department in setup."
                        icon={Building2}
                        items={preview.departments}
                        mappings={data.department_mappings}
                        options={departmentOptions}
                        idKey="department_id"
                        onChange={updateDepartmentMapping}
                        error={errors.department_mappings as string | undefined}
                    />

                    <MappingCard
                        title="Job Titles"
                        description="Match each job title value from your file to a job title in setup."
                        icon={Briefcase}
                        items={preview.job_titles}
                        mappings={data.job_title_mappings}
                        options={jobTitleOptions}
                        idKey="job_title_id"
                        onChange={updateJobTitleMapping}
                        error={errors.job_title_mappings as string | undefined}
                    />
                </div>

                {preview.sample_rows.length > 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Sample rows from file</CardTitle>
                            <CardDescription>Preview of the first rows detected in your upload.</CardDescription>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="border-b bg-muted/30">
                                    <tr>
                                        <th className="px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground">Line</th>
                                        <th className="px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground">Email</th>
                                        <th className="px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground">Employee #</th>
                                        <th className="px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground">Department (file)</th>
                                        <th className="px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground">Job title (file)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.sample_rows.map((row) => (
                                        <tr key={row.line} className="border-t">
                                            <td className="px-4 py-3 text-muted-foreground">{row.line}</td>
                                            <td className="px-4 py-3">{row.user_email}</td>
                                            <td className="px-4 py-3">{row.employee_number}</td>
                                            <td className="px-4 py-3">{row.department_name || '—'}</td>
                                            <td className="px-4 py-3">{row.job_title_name || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                ) : null}

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

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button asChild type="button" variant="outline">
                        <Link href={route('performance.employees.upload')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Upload Different File
                        </Link>
                    </Button>
                    <Button type="button" variant="default" disabled={processing || !canImport} onClick={submitImport}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        {processing ? 'Importing…' : `Import ${preview.row_count} Employees`}
                    </Button>
                </div>
            </div>
        </PerformancePage>
    );
}

function MappingCard({
    title,
    description,
    icon: Icon,
    items,
    mappings,
    options,
    idKey,
    onChange,
    error,
}: {
    title: string;
    description: string;
    icon: typeof Building2;
    items: MappingItem[];
    mappings: Array<Record<string, string>>;
    options: Option[];
    idKey: 'department_id' | 'job_title_id';
    onChange: (index: number, value: string) => void;
    error?: string;
}) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">{title}</CardTitle>
                </div>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No values found in the upload file.</p>
                ) : (
                    items.map((item, index) => {
                        const selectedId = mappings[index]?.[idKey] ?? '';
                        const autoMatched = item.matched_id !== null && String(item.matched_id) === selectedId;

                        return (
                            <div key={item.source} className="rounded-lg border p-4">
                                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <p className="font-medium text-foreground">{item.source}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Used in {item.row_count} row{item.row_count === 1 ? '' : 's'}
                                        </p>
                                    </div>
                                    {autoMatched ? (
                                        <Badge variant="outline" className="gap-1 border-success/40 text-success">
                                            <CheckCheck className="h-3 w-3" />
                                            Auto-matched
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline">Needs mapping</Badge>
                                    )}
                                </div>

                                <Select value={selectedId} onValueChange={(value) => onChange(index, value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={`Select ${title.toLowerCase().slice(0, -1)}`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {options.map((option) => (
                                            <SelectItem key={option.value} value={String(option.value)}>
                                                {option.label}
                                                {'code' in option && option.code ? ` (${String(option.code)})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {item.matched_label && autoMatched ? (
                                    <p className="mt-2 text-xs text-muted-foreground">Matched to: {item.matched_label}</p>
                                ) : null}
                            </div>
                        );
                    })
                )}
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </CardContent>
        </Card>
    );
}
