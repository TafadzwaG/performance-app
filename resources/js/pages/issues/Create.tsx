import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';
import type { IssueOption, IssueType } from '@/types/issues';
import { useForm } from '@inertiajs/react';
import { Loader2, Send } from 'lucide-react';
import type { FormEvent } from 'react';

interface Props {
    typeOptions: IssueOption[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Issues', href: route('issues.index') },
    { title: 'Report issue', href: route('issues.create') },
];

const selectClassName =
    'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function IssuesCreate({ typeOptions }: Props) {
    const { data, setData, post, processing, errors } = useForm<{
        type: IssueType | '';
        title: string;
        description: string;
    }>({
        type: '',
        title: '',
        description: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('issues.store'));
    };

    return (
        <PerformancePage
            title="Report an issue"
            description="Describe the problem so support can investigate and assign a handler."
            breadcrumbs={breadcrumbs}
        >
            <Card className="mx-auto max-w-3xl shadow-sm">
                <CardHeader className="border-b bg-muted/20">
                    <CardTitle>New issue</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={submit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="type">Issue type</Label>
                            <select
                                id="type"
                                className={selectClassName}
                                value={data.type}
                                onChange={(event) => setData('type', event.target.value as IssueType)}
                                required
                            >
                                <option value="">Select issue type</option>
                                {typeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.type ? <p className="text-sm text-red-600">{errors.type}</p> : null}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">Title / summary</Label>
                            <Input
                                id="title"
                                value={data.title}
                                onChange={(event) => setData('title', event.target.value)}
                                placeholder="Brief summary of the issue"
                                required
                            />
                            {errors.title ? <p className="text-sm text-red-600">{errors.title}</p> : null}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                rows={6}
                                className="min-h-[8rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={data.description}
                                onChange={(event) => setData('description', event.target.value)}
                                placeholder="Steps to reproduce, expected behaviour, and any error messages"
                                required
                            />
                            {errors.description ? <p className="text-sm text-red-600">{errors.description}</p> : null}
                        </div>

                        <Button type="submit" disabled={processing}>
                            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Submit issue
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
