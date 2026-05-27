import IssueDetailsFormFields from '@/components/issues/issue-details-form-fields';
import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { IssueOption, IssueReport, IssueType } from '@/types/issues';
import { Link, useForm } from '@inertiajs/react';
import { Loader2, Save } from 'lucide-react';
import type { FormEvent } from 'react';

interface Props {
    issue: IssueReport;
    typeOptions: IssueOption[];
}

export default function IssuesEdit({ issue, typeOptions }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Issues', href: route('issues.index') },
        { title: issue.reference, href: route('issues.show', issue.id) },
        { title: 'Edit', href: route('issues.edit', issue.id) },
    ];

    const { data, setData, put, processing, errors } = useForm<{
        type: IssueType;
        title: string;
        description: string;
    }>({
        type: issue.type,
        title: issue.title,
        description: issue.description,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(route('issues.update', issue.id));
    };

    return (
        <PerformancePage title={`Edit ${issue.reference}`} description="Update issue details." breadcrumbs={breadcrumbs}>
            <Card className="mx-auto max-w-3xl shadow-sm">
                <CardHeader className="border-b bg-muted/20">
                    <CardTitle>Issue details</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={submit} className="space-y-5">
                        <IssueDetailsFormFields
                            type={data.type}
                            title={data.title}
                            description={data.description}
                            typeOptions={typeOptions}
                            errors={errors}
                            onTypeChange={(value) => setData('type', value)}
                            onTitleChange={(value) => setData('title', value)}
                            onDescriptionChange={(value) => setData('description', value)}
                        />

                        <div className="flex gap-3">
                            <Button type="submit" disabled={processing}>
                                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save changes
                            </Button>
                            <Button asChild variant="outline">
                                <Link href={route('issues.show', issue.id)}>Cancel</Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
