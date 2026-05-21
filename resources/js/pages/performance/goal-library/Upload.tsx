import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Download, FileSpreadsheet, ShieldCheck, UploadCloud } from 'lucide-react';
import type { FormEvent } from 'react';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface ImportGoalsFormData {
    file: File | null;
    [key: string]: File | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Goal Library', href: route('performance.goal_library.index') },
    { title: 'Upload', href: route('performance.goal_library.upload') },
];

const templateColumns = 'perspective, objective, kpi_measure, target_definition, weight, evidence_source, department_name, job_title_name, is_active';

export default function GoalLibraryUpload() {
    const { data, setData, post, processing, errors } = useForm<ImportGoalsFormData>({
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
        post(route('performance.goal_library.upload.preview'), {
            forceFormData: true,
        });
    };

    return (
        <PerformancePage
            title="Upload Goal Library"
            description="Import reusable performance goals from the assessment-form spreadsheet format."
            breadcrumbs={breadcrumbs}
            secondaryActions={
                <Button asChild variant="info">
                    <a href={route('performance.goal_library.upload.template')}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Template
                    </a>
                </Button>
            }
        >
            <form onSubmit={submit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardDescription className="text-[11px] font-medium tracking-[0.18em] uppercase">Spreadsheet Upload</CardDescription>
                        <CardTitle>Goal Import File</CardTitle>
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
                                <div className="bg-background text-foreground rounded-lg border p-3">
                                    <UploadCloud className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-foreground text-sm font-medium">
                                        {data.file ? data.file.name : 'Drag and drop your file here, or click to browse'}
                                    </p>
                                    <p className="text-muted-foreground text-xs">Accepted formats: CSV, XLSX, and ODS (max 10MB)</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-foreground text-sm font-medium">Or choose a file</label>
                            <Input type="file" accept=".csv,.xlsx,.ods" onChange={(event) => setData('file', event.target.files?.[0] ?? null)} />
                        </div>

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

                        <div className="bg-muted/20 text-muted-foreground rounded-lg border p-4 text-sm">
                            <div className="text-foreground mb-2 flex items-center gap-2 font-medium">
                                <FileSpreadsheet className="h-4 w-4" />
                                Template columns
                            </div>
                            <p>{templateColumns}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardDescription className="text-[11px] font-medium tracking-[0.18em] uppercase">Import Rules</CardDescription>
                        <CardTitle>Before You Upload</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground space-y-3 text-sm">
                        <div className="rounded-lg border px-4 py-3">
                            Each imported row becomes a reusable Goal Library item. It will not assign goals to employee appraisals.
                        </div>
                        <div className="rounded-lg border px-4 py-3">
                            The import accepts the normalized template or a form-like assessment table with the same objective columns.
                        </div>
                        <div className="rounded-lg border px-4 py-3">
                            Perspective is required. Department and job title are optional, but any provided labels must be mapped before import.
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button asChild type="button" variant="outline">
                        <Link href={route('performance.goal_library.index')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Cancel
                        </Link>
                    </Button>
                    <Button type="submit" disabled={processing || !data.file}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        {processing ? 'Analyzing...' : 'Continue to Matching'}
                    </Button>
                </div>
            </form>
        </PerformancePage>
    );
}
