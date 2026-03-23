import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { BreadcrumbItem } from '@/types';
import type { Option, ReviewCycle } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import {
    CheckCircle2,
    ClipboardList,
    FileText,
    Layers3,
    Send,
    Users,
    UserPlus,
} from 'lucide-react';

interface Props {
    reviewCycle: ReviewCycle;
    employeeProfileOptions: Option[];
    templateOptions: Option[];
}

const breadcrumbs = (cycle: ReviewCycle): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Review Cycles', href: route('performance.review_cycles.index') },
    { title: cycle.name, href: route('performance.review_cycles.show', cycle.id) },
    { title: 'Assign Employees', href: route('performance.review_cycles.assign', cycle.id) },
];

export default function AssignEmployees({ reviewCycle, employeeProfileOptions, templateOptions }: Props) {
    const { data, setData, post, processing } = useForm<{ template_id: string; employee_profile_ids: number[] }>({
        template_id: '',
        employee_profile_ids: [],
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('performance.review_cycles.assign.store', reviewCycle.id));
    };

    const selectedTemplate =
        templateOptions.find((option) => String(option.value) === data.template_id)?.label ?? 'Not selected';

    const selectedEmployees = employeeProfileOptions.filter((option) =>
        data.employee_profile_ids.includes(Number(option.value)),
    );

    return (
        <PerformancePage
            title="Assign Employees"
            description="Generate appraisals for employees in this cycle."
            breadcrumbs={breadcrumbs(reviewCycle)}
        >
            <form onSubmit={submit} className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Assignment workspace
                            </Badge>

                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                    Assign Employees
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Select a template and assign employees to generate appraisal records for{' '}
                                    {reviewCycle.name}.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Cycle</div>
                                <div className="mt-1 font-semibold text-foreground">{reviewCycle.name}</div>
                            </div>

                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Selected</div>
                                <div className="mt-1 font-semibold text-foreground">
                                    {data.employee_profile_ids.length} employee{data.employee_profile_ids.length === 1 ? '' : 's'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Layers3 className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Templates</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{templateOptions.length}</div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Available appraisal templates for assignment.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Employees</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{employeeProfileOptions.length}</div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Employee profiles available for this cycle.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <CheckCircle2 className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Ready to Assign</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{data.employee_profile_ids.length}</div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Employees currently selected for assignment.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 xl:grid-cols-12">
                    <Card className="shadow-sm xl:col-span-8">
                        <CardHeader className="border-b bg-muted/20">
                            <div className="flex items-center gap-2">
                                <UserPlus className="h-4.5 w-4.5 text-muted-foreground" />
                                <div>
                                    <CardTitle className="text-lg">Assignment Setup</CardTitle>
                                    <CardDescription>
                                        Choose the template and select the employees who should receive appraisals.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6 p-6">
                            <div className="space-y-2">
                                <Label htmlFor="template_id">Appraisal Template</Label>
                                <select
                                    id="template_id"
                                    className="flex h-11 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

                            <Separator />

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="employee_profile_ids">Employee Profiles</Label>
                                    <span className="text-xs text-muted-foreground">
                                        Hold Ctrl / Cmd to select multiple
                                    </span>
                                </div>

                                <select
                                    id="employee_profile_ids"
                                    multiple
                                    className="min-h-[420px] w-full rounded-md border bg-background px-3 py-3 text-sm outline-none ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={data.employee_profile_ids.map(String)}
                                    onChange={(event) =>
                                        setData(
                                            'employee_profile_ids',
                                            Array.from(event.target.selectedOptions).map((option) => Number(option.value)),
                                        )
                                    }
                                >
                                    {employeeProfileOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6 xl:col-span-4">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <ClipboardList className="h-4.5 w-4.5 text-muted-foreground" />
                                    <CardTitle className="text-lg">Assignment Summary</CardTitle>
                                </div>
                                <CardDescription>
                                    Review your current assignment selection before submitting.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="rounded-lg border bg-muted/20 p-4">
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                        Selected Template
                                    </div>
                                    <div className="mt-2 text-sm font-medium text-foreground">{selectedTemplate}</div>
                                </div>

                                <div className="rounded-lg border bg-muted/20 p-4">
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                        Employees Selected
                                    </div>
                                    <div className="mt-2 text-sm font-medium text-foreground">
                                        {data.employee_profile_ids.length}
                                    </div>
                                </div>

                                <div className="rounded-lg border bg-muted/20 p-4">
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                        Review Cycle
                                    </div>
                                    <div className="mt-2 text-sm font-medium text-foreground">
                                        {reviewCycle.name}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4.5 w-4.5 text-muted-foreground" />
                                    <CardTitle className="text-lg">Selected Employees</CardTitle>
                                </div>
                                <CardDescription>
                                    Preview of the employee profiles currently included.
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                {selectedEmployees.length === 0 ? (
                                    <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                                        No employees selected yet.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedEmployees.slice(0, 8).map((employee) => (
                                            <div
                                                key={employee.value}
                                                className="rounded-lg border bg-muted/20 px-3 py-2 text-sm"
                                            >
                                                <div className="font-medium text-foreground">{employee.label}</div>
                                            </div>
                                        ))}

                                        {selectedEmployees.length > 8 ? (
                                            <div className="text-xs text-muted-foreground">
                                                +{selectedEmployees.length - 8} more selected
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex flex-col gap-4 border-t pt-6 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-muted-foreground">
                        Submitting will generate appraisals for all selected employees using the chosen template.
                    </div>

                    <Button type="submit" disabled={processing}>
                        <Send className="mr-2 h-4 w-4" />
                        Assign Selected Employees
                    </Button>
                </div>
            </form>
        </PerformancePage>
    );
}