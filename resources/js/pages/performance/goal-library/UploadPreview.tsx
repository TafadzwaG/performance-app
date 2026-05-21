import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';
import type { GoalImportMappingItem, GoalImportPreview, Option } from '@/types/performance';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Briefcase, Building2, CheckCheck, Layers3, ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';

interface Props {
    preview: GoalImportPreview;
    perspectiveOptions: Option[];
    departmentOptions: Option[];
    jobTitleOptions: Option[];
}

type PerspectiveMappingRow = { source: string; perspective_id: string };
type DepartmentMappingRow = { source: string; department_id: string };
type JobTitleMappingRow = { source: string; job_title_id: string };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Goal Library', href: route('performance.goal_library.index') },
    { title: 'Upload', href: route('performance.goal_library.upload') },
    { title: 'Match Setup', href: route('performance.goal_library.upload.preview') },
];

function initialMappings(items: GoalImportMappingItem[], idKey: 'perspective_id' | 'department_id' | 'job_title_id') {
    return items.map((item) => ({
        source: item.source,
        [idKey]: item.matched_id ? String(item.matched_id) : '',
    }));
}

export default function GoalLibraryUploadPreview({ preview, perspectiveOptions, departmentOptions, jobTitleOptions }: Props) {
    const { data, setData, post, processing, errors } = useForm<{
        perspective_mappings: PerspectiveMappingRow[];
        department_mappings: DepartmentMappingRow[];
        job_title_mappings: JobTitleMappingRow[];
    }>({
        perspective_mappings: initialMappings(preview.perspectives, 'perspective_id') as PerspectiveMappingRow[],
        department_mappings: initialMappings(preview.departments, 'department_id') as DepartmentMappingRow[],
        job_title_mappings: initialMappings(preview.job_titles, 'job_title_id') as JobTitleMappingRow[],
    });

    const unmappedPerspectives = useMemo(() => data.perspective_mappings.filter((row) => !row.perspective_id).length, [data.perspective_mappings]);
    const unmappedDepartments = useMemo(() => data.department_mappings.filter((row) => !row.department_id).length, [data.department_mappings]);
    const unmappedJobTitles = useMemo(() => data.job_title_mappings.filter((row) => !row.job_title_id).length, [data.job_title_mappings]);

    const canImport =
        preview.row_count > 0 &&
        preview.row_errors.length === 0 &&
        unmappedPerspectives === 0 &&
        unmappedDepartments === 0 &&
        unmappedJobTitles === 0;

    const submitImport = () => {
        post(route('performance.goal_library.upload.store'));
    };

    return (
        <PerformancePage
            title="Match Goal Setup"
            description="Review values from the spreadsheet and map them to setup records before importing goals."
            breadcrumbs={breadcrumbs}
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardDescription className="text-[11px] font-medium tracking-[0.18em] uppercase">Import Summary</CardDescription>
                        <CardTitle>{preview.row_count} goal rows ready</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                        <Badge variant="secondary">{preview.perspectives.length} perspective values</Badge>
                        <Badge variant="secondary">{preview.departments.length} department values</Badge>
                        <Badge variant="secondary">{preview.job_titles.length} job title values</Badge>
                        {unmappedPerspectives > 0 ? (
                            <Badge variant="destructive">{unmappedPerspectives} perspectives need mapping</Badge>
                        ) : (
                            <Badge variant="outline">All perspectives mapped</Badge>
                        )}
                        {unmappedDepartments > 0 ? (
                            <Badge variant="destructive">{unmappedDepartments} departments need mapping</Badge>
                        ) : (
                            <Badge variant="outline">All departments mapped</Badge>
                        )}
                        {unmappedJobTitles > 0 ? (
                            <Badge variant="destructive">{unmappedJobTitles} job titles need mapping</Badge>
                        ) : (
                            <Badge variant="outline">All job titles mapped</Badge>
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
                            <ul className="text-destructive list-disc space-y-1 pl-5 text-sm">
                                {preview.row_errors.map((message) => (
                                    <li key={message}>{message}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ) : null}

                <div className="grid gap-6 xl:grid-cols-3">
                    <MappingCard
                        title="Perspectives"
                        description="Match each perspective value to a setup perspective."
                        icon={Layers3}
                        items={preview.perspectives}
                        mappings={data.perspective_mappings}
                        options={perspectiveOptions}
                        idKey="perspective_id"
                        onChange={(index, value) => {
                            const next = [...data.perspective_mappings];
                            next[index] = { ...next[index], perspective_id: value };
                            setData('perspective_mappings', next);
                        }}
                        error={errors.perspective_mappings as string | undefined}
                    />
                    <MappingCard
                        title="Departments"
                        description="Match optional department values to setup departments."
                        icon={Building2}
                        items={preview.departments}
                        mappings={data.department_mappings}
                        options={departmentOptions}
                        idKey="department_id"
                        onChange={(index, value) => {
                            const next = [...data.department_mappings];
                            next[index] = { ...next[index], department_id: value };
                            setData('department_mappings', next);
                        }}
                        error={errors.department_mappings as string | undefined}
                    />
                    <MappingCard
                        title="Job Titles"
                        description="Match optional role values to setup job titles."
                        icon={Briefcase}
                        items={preview.job_titles}
                        mappings={data.job_title_mappings}
                        options={jobTitleOptions}
                        idKey="job_title_id"
                        onChange={(index, value) => {
                            const next = [...data.job_title_mappings];
                            next[index] = { ...next[index], job_title_id: value };
                            setData('job_title_mappings', next);
                        }}
                        error={errors.job_title_mappings as string | undefined}
                    />
                </div>

                {preview.sample_rows.length > 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Sample rows from file</CardTitle>
                            <CardDescription>Preview of the first goal rows detected in your upload.</CardDescription>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-muted/30 border-b">
                                    <tr>
                                        <th className="text-muted-foreground px-4 py-3 text-xs tracking-wide uppercase">Line</th>
                                        <th className="text-muted-foreground px-4 py-3 text-xs tracking-wide uppercase">Perspective</th>
                                        <th className="text-muted-foreground px-4 py-3 text-xs tracking-wide uppercase">Objective</th>
                                        <th className="text-muted-foreground px-4 py-3 text-xs tracking-wide uppercase">KPI</th>
                                        <th className="text-muted-foreground px-4 py-3 text-xs tracking-wide uppercase">Target</th>
                                        <th className="text-muted-foreground px-4 py-3 text-xs tracking-wide uppercase">Weight</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.sample_rows.map((row) => (
                                        <tr key={row.line} className="border-t">
                                            <td className="text-muted-foreground px-4 py-3">{row.line}</td>
                                            <td className="px-4 py-3">{row.perspective}</td>
                                            <td className="px-4 py-3">{row.objective}</td>
                                            <td className="text-muted-foreground px-4 py-3">{row.kpi_measure || '-'}</td>
                                            <td className="text-muted-foreground px-4 py-3">{row.target_definition || '-'}</td>
                                            <td className="text-muted-foreground px-4 py-3">{row.weight || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                ) : null}

                {errors.file ? (
                    <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border px-4 py-3 text-sm">
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
                        <Link href={route('performance.goal_library.upload')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Upload Different File
                        </Link>
                    </Button>
                    <Button type="button" disabled={processing || !canImport} onClick={submitImport}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        {processing ? 'Importing...' : `Import ${preview.row_count} Goals`}
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
    icon: typeof Layers3;
    items: GoalImportMappingItem[];
    mappings: Array<Record<string, string>>;
    options: Option[];
    idKey: 'perspective_id' | 'department_id' | 'job_title_id';
    onChange: (index: number, value: string) => void;
    error?: string;
}) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Icon className="text-muted-foreground h-5 w-5" />
                    <CardTitle className="text-base">{title}</CardTitle>
                </div>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {items.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No values found in the upload file.</p>
                ) : (
                    items.map((item, index) => {
                        const selectedId = mappings[index]?.[idKey] ?? '';
                        const autoMatched = item.matched_id !== null && String(item.matched_id) === selectedId;

                        return (
                            <div key={item.source} className="rounded-lg border p-4">
                                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <p className="text-foreground font-medium">{item.source}</p>
                                        <p className="text-muted-foreground text-xs">
                                            Used in {item.row_count} row{item.row_count === 1 ? '' : 's'}
                                        </p>
                                    </div>
                                    {autoMatched ? (
                                        <Badge variant="outline" className="gap-1">
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
                            </div>
                        );
                    })
                )}
                {error ? <p className="text-destructive text-sm">{error}</p> : null}
            </CardContent>
        </Card>
    );
}
