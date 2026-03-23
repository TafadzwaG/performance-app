import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { BreadcrumbItem } from '@/types';
import type { Option } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import {
    ClipboardList,
    FileText,
    Layers3,
    Plus,
    ShieldCheck,
    UserRound,
} from 'lucide-react';

interface Props {
    reviewCycleOptions: Option[];
    employeeProfileOptions: Option[];
    templateOptions: Option[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Appraisals', href: route('performance.appraisals.index') },
    { title: 'Create', href: route('performance.appraisals.create') },
];

export default function AppraisalCreate({
    reviewCycleOptions,
    employeeProfileOptions,
    templateOptions,
}: Props) {
    const { data, setData, post, processing } = useForm({
        review_cycle_id: '',
        employee_profile_id: '',
        template_id: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('performance.appraisals.store'));
    };

    const selectedCycle =
        reviewCycleOptions.find((option) => String(option.value) === data.review_cycle_id)?.label ?? 'Not selected';

    const selectedEmployee =
        employeeProfileOptions.find((option) => String(option.value) === data.employee_profile_id)?.label ??
        'Not selected';

    const selectedTemplate =
        templateOptions.find((option) => String(option.value) === data.template_id)?.label ?? 'Not selected';

    return (
        <PerformancePage
            title="Create Appraisal"
            description="Create a manual appraisal assignment for a cycle."
            breadcrumbs={breadcrumbs}
        >
            <div className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Manual appraisal assignment
                            </Badge>

                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                    Create Appraisal
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                                    Initiate a formal performance assessment by selecting the review cycle, employee,
                                    and appraisal template.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Cycles</div>
                                <div className="mt-1 font-semibold text-foreground">{reviewCycleOptions.length}</div>
                            </div>

                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Employees</div>
                                <div className="mt-1 font-semibold text-foreground">{employeeProfileOptions.length}</div>
                            </div>

                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Templates</div>
                                <div className="mt-1 font-semibold text-foreground">{templateOptions.length}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Layers3 className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Review Cycle</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Choose the cycle that this appraisal belongs to.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <UserRound className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Employee</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Select the employee profile that will receive the appraisal assignment.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <ClipboardList className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Template</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Pick the evaluation template that defines the appraisal structure.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 xl:grid-cols-12">
                    <Card className="shadow-sm xl:col-span-8">
                        <CardHeader className="border-b bg-muted/20">
                            <div>
                                <CardTitle className="text-lg">Appraisal Setup</CardTitle>
                                <CardDescription>
                                    Complete the required selections below to create a new appraisal record.
                                </CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6">
                            <form onSubmit={submit} className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Review Cycle
                                        </label>
                                        <select
                                            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            value={data.review_cycle_id}
                                            onChange={(event) => setData('review_cycle_id', event.target.value)}
                                        >
                                            <option value="">Select cycle</option>
                                            {reviewCycleOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Employee
                                        </label>
                                        <select
                                            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            value={data.employee_profile_id}
                                            onChange={(event) => setData('employee_profile_id', event.target.value)}
                                        >
                                            <option value="">Select employee</option>
                                            {employeeProfileOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Template
                                        </label>
                                        <select
                                            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            value={data.template_id}
                                            onChange={(event) => setData('template_id', event.target.value)}
                                        >
                                            <option value="">Select template</option>
                                            {templateOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                                        <p>
                                            Creating this appraisal will register a manual assignment for the selected
                                            cycle, employee, and template.
                                        </p>
                                    </div>

                                    <Button type="submit" disabled={processing}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Appraisal
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="space-y-6 xl:col-span-4">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Selection Summary</CardTitle>
                                <CardDescription>
                                    Review the current setup before creating the appraisal.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="rounded-lg border bg-muted/20 p-4">
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                        Selected Cycle
                                    </div>
                                    <div className="mt-1 text-sm font-medium text-foreground">{selectedCycle}</div>
                                </div>

                                <div className="rounded-lg border bg-muted/20 p-4">
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                        Selected Employee
                                    </div>
                                    <div className="mt-1 text-sm font-medium text-foreground">{selectedEmployee}</div>
                                </div>

                                <div className="rounded-lg border bg-muted/20 p-4">
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                        Selected Template
                                    </div>
                                    <div className="mt-1 text-sm font-medium text-foreground">{selectedTemplate}</div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Notes</CardTitle>
                                <CardDescription>
                                    Keep the assignment intentional and aligned with the current review cycle.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <div className="rounded-lg border bg-muted/20 p-3">
                                    Make sure the selected employee belongs to the intended cycle window.
                                </div>
                                <div className="rounded-lg border bg-muted/20 p-3">
                                    The template determines the structure and scoring framework of the appraisal.
                                </div>
                                <div className="rounded-lg border bg-muted/20 p-3">
                                    Only the button action creates the appraisal. No extra behavior has been added.
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Configuration Coverage</CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
                                    <span className="text-muted-foreground">Review cycles</span>
                                    <span className="font-medium text-foreground">{reviewCycleOptions.length}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
                                    <span className="text-muted-foreground">Employees</span>
                                    <span className="font-medium text-foreground">{employeeProfileOptions.length}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
                                    <span className="text-muted-foreground">Templates</span>
                                    <span className="font-medium text-foreground">{templateOptions.length}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </PerformancePage>
    );
}