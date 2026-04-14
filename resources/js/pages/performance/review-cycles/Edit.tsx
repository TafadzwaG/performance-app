import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, toDateInputValue } from '@/lib/date-utils';
import type { BreadcrumbItem } from '@/types';
import type { ReviewCycle } from '@/types/performance';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { differenceInCalendarDays, format } from 'date-fns';
import type { FormEvent } from 'react';
import {
    CalendarDays,
    CalendarRange,
    Clock3,
    ClipboardList,
    FileText,
    Info,
    Save,
} from 'lucide-react';

function parseDateValue(value: string): Date | undefined {
    if (!value) return undefined;

    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return undefined;

    return new Date(year, month - 1, day);
}

function formatDateValue(date?: Date): string {
    if (!date) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function DatePickerField({
    label,
    value,
    onChange,
    placeholder = 'Pick a date',
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    const selectedDate = parseDateValue(value);

    return (
        <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </Label>

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className={cn(
                            'h-11 w-full justify-between rounded-lg bg-background px-3 font-normal',
                            !selectedDate && 'text-muted-foreground',
                        )}
                    >
                        <span>{selectedDate ? format(selectedDate, 'PPP') : placeholder}</span>
                        <CalendarDays className="h-4 w-4 opacity-70" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent align="start" className="w-[420px] p-4">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => onChange(formatDateValue(date))}
                        initialFocus
                        className="w-full rounded-md border p-3"
                        classNames={{
                            months: 'w-full',
                            month: 'w-full space-y-4',
                            caption: 'flex justify-center pt-1 relative items-center',
                            caption_label: 'text-base font-semibold',
                            nav: 'space-x-1 flex items-center',
                            nav_button: 'h-9 w-9',
                            table: 'w-full border-collapse space-y-1',
                            head_row: 'flex w-full',
                            head_cell:
                                'text-muted-foreground rounded-md w-12 font-normal text-[0.85rem]',
                            row: 'flex w-full mt-2',
                            cell: 'relative h-12 w-12 p-0 text-center text-sm',
                            day: 'h-12 w-12 p-0 font-normal',
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}

export default function ReviewCycleEdit({ reviewCycle }: { reviewCycle: ReviewCycle }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Performance', href: '/performance/dashboard' },
        { title: 'Review Cycles', href: route('performance.review_cycles.index') },
        { title: reviewCycle.name, href: route('performance.review_cycles.show', reviewCycle.id) },
        { title: 'Edit', href: route('performance.review_cycles.edit', reviewCycle.id) },
    ];

    const { data, setData, put, processing } = useForm({
        name: reviewCycle.name,
        code: reviewCycle.code,
        description: reviewCycle.description ?? '',
        start_date: toDateInputValue(reviewCycle.start_date),
        end_date: toDateInputValue(reviewCycle.end_date),
        goal_setting_deadline: toDateInputValue(reviewCycle.goal_setting_deadline),
        self_assessment_deadline: toDateInputValue(reviewCycle.self_assessment_deadline),
        manager_review_deadline: toDateInputValue(reviewCycle.manager_review_deadline),
        approval_deadline: toDateInputValue(reviewCycle.approval_deadline),
        status: reviewCycle.status,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(route('performance.review_cycles.update', reviewCycle.id));
    };

    const startDate = parseDateValue(data.start_date);
    const endDate = parseDateValue(data.end_date);
    const cycleLength =
        startDate && endDate ? Math.max(differenceInCalendarDays(endDate, startDate) + 1, 0) : null;

    return (
        <PerformancePage
            title="Edit Review Cycle"
            description="Update cycle dates and status."
            breadcrumbs={breadcrumbs}
        >
            <form onSubmit={submit} className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Cycle setup
                            </Badge>

                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                    Edit Review Cycle
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Update the review cycle timeline, workflow milestones, and current operational
                                    status.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
                                <div className="mt-1 font-semibold capitalize text-foreground">{data.status}</div>
                            </div>

                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Cycle Length</div>
                                <div className="mt-1 font-semibold text-foreground">
                                    {cycleLength !== null ? `${cycleLength} days` : 'Not set'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-12">
                    <div className="space-y-6 xl:col-span-8">
                        <Card className="shadow-sm">
                            <CardHeader className="border-b bg-muted/20">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4.5 w-4.5 text-muted-foreground" />
                                    <div>
                                        <CardTitle className="text-lg">Cycle Metadata</CardTitle>
                                        <CardDescription>
                                            Update the cycle identity, description, and status.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-6 p-6">
                                <div className="grid gap-6 md:grid-cols-3">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="name">Cycle Name</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(event) => setData('name', event.target.value)}
                                            placeholder="e.g. Annual Performance Review 2026"
                                            className="h-11"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                            <SelectTrigger id="status" className="h-11">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="open">Open</SelectItem>
                                                <SelectItem value="closed">Closed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="code">Cycle Code</Label>
                                        <Input
                                            id="code"
                                            value={data.code}
                                            onChange={(event) => setData('code', event.target.value)}
                                            placeholder="ARC-2026-Q1"
                                            className="h-11 uppercase"
                                        />
                                    </div>

                                    <div className="space-y-2 md:col-span-3">
                                        <Label htmlFor="description">Description</Label>
                                        <textarea
                                            id="description"
                                            className="min-h-28 w-full rounded-md border bg-background px-3 py-3 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            value={data.description}
                                            onChange={(event) => setData('description', event.target.value)}
                                            placeholder="Define the scope and objectives for this review cycle..."
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <Card className="shadow-sm">
                                <CardHeader className="border-b bg-muted/20">
                                    <div className="flex items-center gap-2">
                                        <CalendarRange className="h-4.5 w-4.5 text-muted-foreground" />
                                        <div>
                                            <CardTitle className="text-lg">Evaluation Period</CardTitle>
                                            <CardDescription>
                                                Update the overall review window for this cycle.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-5 p-6">
                                    <DatePickerField
                                        label="Start Date"
                                        value={data.start_date}
                                        onChange={(value) => setData('start_date', value)}
                                    />

                                    <DatePickerField
                                        label="End Date"
                                        value={data.end_date}
                                        onChange={(value) => setData('end_date', value)}
                                    />
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm">
                                <CardHeader className="border-b bg-muted/20">
                                    <div className="flex items-center gap-2">
                                        <Clock3 className="h-4.5 w-4.5 text-muted-foreground" />
                                        <div>
                                            <CardTitle className="text-lg">Milestones & Deadlines</CardTitle>
                                            <CardDescription>
                                                Adjust the workflow checkpoints for this cycle.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-5 p-6">
                                    <DatePickerField
                                        label="Goal Setting Deadline"
                                        value={data.goal_setting_deadline}
                                        onChange={(value) => setData('goal_setting_deadline', value)}
                                    />

                                    <DatePickerField
                                        label="Self-Assessment Deadline"
                                        value={data.self_assessment_deadline}
                                        onChange={(value) => setData('self_assessment_deadline', value)}
                                    />

                                    <DatePickerField
                                        label="Manager Review Deadline"
                                        value={data.manager_review_deadline}
                                        onChange={(value) => setData('manager_review_deadline', value)}
                                    />

                                    <DatePickerField
                                        label="Approval Deadline"
                                        value={data.approval_deadline}
                                        onChange={(value) => setData('approval_deadline', value)}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="space-y-6 xl:col-span-4">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <ClipboardList className="h-4.5 w-4.5 text-muted-foreground" />
                                    <CardTitle className="text-lg">Cycle Snapshot</CardTitle>
                                </div>
                                <CardDescription>
                                    Quick summary of the current review cycle state.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
                                    <span className="text-muted-foreground">Name</span>
                                    <span className="max-w-[55%] truncate text-right font-medium text-foreground">
                                        {data.name || 'Not set'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
                                    <span className="text-muted-foreground">Code</span>
                                    <span className="font-medium text-foreground">{data.code || 'Not set'}</span>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
                                    <span className="text-muted-foreground">Status</span>
                                    <span className="font-medium capitalize text-foreground">{data.status}</span>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
                                    <span className="text-muted-foreground">Start</span>
                                    <span className="font-medium text-foreground">{formatDate(data.start_date)}</span>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
                                    <span className="text-muted-foreground">End</span>
                                    <span className="font-medium text-foreground">{formatDate(data.end_date)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Info className="h-4.5 w-4.5 text-muted-foreground" />
                                    <CardTitle className="text-lg">Notes</CardTitle>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <div className="rounded-lg border bg-muted/20 p-3">
                                    Updating the cycle dates can affect milestone planning and review timing.
                                </div>
                                <div className="rounded-lg border bg-muted/20 p-3">
                                    Keep milestone dates aligned within the main cycle period for a cleaner workflow.
                                </div>
                                <div className="rounded-lg border bg-muted/20 p-3">
                                    This version keeps your existing update flow and only upgrades the presentation and date selection.
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex flex-col gap-4 border-t pt-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Info className="h-4 w-4" />
                        <span>Changes will apply when you update the review cycle.</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            Update Review Cycle
                        </Button>
                    </div>
                </div>
            </form>
        </PerformancePage>
    );
}
