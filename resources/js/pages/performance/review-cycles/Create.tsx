import InputError from '@/components/input-error';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import type { Option } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import { addMonths, differenceInCalendarDays, format, isAfter, isBefore, startOfDay, subMonths } from 'date-fns';
import { CalendarDays, CalendarRange, ClipboardList, Clock3, FileText, Info, Send, Sparkles } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Review Cycles', href: route('performance.review_cycles.index') },
    { title: 'Create', href: route('performance.review_cycles.create') },
];

type DateFieldValue = string;

function parseDateValue(value: DateFieldValue): Date | undefined {
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

const calendarStartMonth = new Date(new Date().getFullYear() - 10, 0, 1);
const calendarEndMonth = new Date(new Date().getFullYear() + 10, 11, 1);

function clampCalendarMonth(date: Date): Date {
    const month = new Date(date.getFullYear(), date.getMonth(), 1);

    if (isBefore(month, calendarStartMonth)) return calendarStartMonth;
    if (isAfter(month, calendarEndMonth)) return calendarEndMonth;

    return month;
}

function buildCycleCode(name: string): string {
    const sanitizedName = name
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, ' ')
        .trim();

    const initials = sanitizedName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3)
        .map((part) => part[0])
        .join('');

    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const randomSuffix = Math.floor(Math.random() * 9000 + 1000);
    const prefix = initials || 'RC';

    return `${prefix}-${yearMonth}-${randomSuffix}`;
}

function buildCycleDescription(data: {
    name: string;
    code: string;
    start_date: string;
    end_date: string;
    goal_setting_deadline: string;
    self_assessment_deadline: string;
    manager_review_deadline: string;
    approval_deadline: string;
}): string {
    const name = data.name || 'this review cycle';
    const codePart = data.code ? ` (${data.code})` : '';
    const period = data.start_date && data.end_date ? `from ${data.start_date} to ${data.end_date}` : 'for the configured period';

    const milestones: string[] = [];
    if (data.goal_setting_deadline) milestones.push(`Goal setting deadline: ${data.goal_setting_deadline}`);
    if (data.self_assessment_deadline) milestones.push(`Self-assessment deadline: ${data.self_assessment_deadline}`);
    if (data.manager_review_deadline) milestones.push(`Manager review deadline: ${data.manager_review_deadline}`);
    if (data.approval_deadline) milestones.push(`Approval deadline: ${data.approval_deadline}`);

    const milestoneText =
        milestones.length > 0 ? ` Key milestones include ${milestones.join('; ')}.` : ' Milestones will be finalized once all deadlines are set.';

    return `This cycle, ${name}${codePart}, runs ${period} and is currently in draft status.${milestoneText}`;
}

function DatePickerField({
    label,
    value,
    onChange,
    placeholder = 'Pick a date',
    error,
    minDate,
    maxDate,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    minDate?: Date;
    maxDate?: Date;
}) {
    const selectedDate = parseDateValue(value);
    const min = minDate ? startOfDay(minDate) : undefined;
    const max = maxDate ? startOfDay(maxDate) : undefined;
    const [visibleMonth, setVisibleMonth] = useState(() => clampCalendarMonth(selectedDate ?? min ?? new Date()));

    useEffect(() => {
        if (selectedDate) {
            setVisibleMonth(clampCalendarMonth(selectedDate));
        }
    }, [value]);

    const changeVisibleMonth = (date: Date) => {
        setVisibleMonth(clampCalendarMonth(date));
    };

    return (
        <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</Label>

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className={cn(
                            'bg-background h-11 w-full justify-between rounded-lg px-3 font-normal',
                            !selectedDate && 'text-muted-foreground',
                        )}
                    >
                        <span>{selectedDate ? format(selectedDate, 'PPP') : placeholder}</span>
                        <CalendarDays className="h-4 w-4 opacity-70" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent
                    align="start"
                    className="w-[420px] p-4"
                    onWheel={(event) => {
                        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

                        event.preventDefault();
                        changeVisibleMonth(event.deltaY > 0 ? addMonths(visibleMonth, 1) : subMonths(visibleMonth, 1));
                    }}
                >
                    <Calendar
                        mode="single"
                        captionLayout="dropdown"
                        month={visibleMonth}
                        onMonthChange={changeVisibleMonth}
                        startMonth={calendarStartMonth}
                        endMonth={calendarEndMonth}
                        selected={selectedDate}
                        onSelect={(date) => onChange(formatDateValue(date))}
                        disabled={(date) => {
                            const current = startOfDay(date);

                            return Boolean((min && isBefore(current, min)) || (max && isAfter(current, max)));
                        }}
                        initialFocus
                        className="w-full rounded-md border p-3"
                    />
                </PopoverContent>
            </Popover>
            <InputError message={error} />
        </div>
    );
}

export default function ReviewCycleCreate({ templateOptions }: { templateOptions: Option[] }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        description: '',
        start_date: '',
        end_date: '',
        goal_setting_deadline: '',
        self_assessment_deadline: '',
        manager_review_deadline: '',
        approval_deadline: '',
        template_id: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('performance.review_cycles.store'));
    };

    const startDate = parseDateValue(data.start_date);
    const endDate = parseDateValue(data.end_date);
    const today = startOfDay(new Date());
    const cycleLength = startDate && endDate ? Math.max(differenceInCalendarDays(endDate, startDate) + 1, 0) : null;

    return (
        <PerformancePage
            title="Create Review Cycle"
            description="Add the dates and workflow windows for a performance cycle."
            breadcrumbs={breadcrumbs}
        >
            <form onSubmit={submit} className="space-y-6">
                <div className="bg-background rounded-2xl border p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Cycle setup
                            </Badge>

                            <div>
                                <h1 className="text-foreground text-3xl font-bold tracking-tight">Create Review Cycle</h1>
                                <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
                                    Configure the parameters and lifecycle deadlines for your organizational performance evaluation period.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className="bg-muted/30 rounded-xl border px-4 py-3 text-sm">
                                <div className="text-muted-foreground text-xs tracking-wide uppercase">Status</div>
                                <div className="text-foreground mt-1 font-semibold">Draft</div>
                            </div>

                            <div className="bg-muted/30 rounded-xl border px-4 py-3 text-sm">
                                <div className="text-muted-foreground text-xs tracking-wide uppercase">Cycle Length</div>
                                <div className="text-foreground mt-1 font-semibold">{cycleLength !== null ? `${cycleLength} days` : 'Not set'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-12">
                    <div className="space-y-6 xl:col-span-8">
                        <Card className="shadow-sm">
                            <CardHeader className="bg-muted/20 border-b">
                                <div className="flex items-center gap-2">
                                    <FileText className="text-muted-foreground h-4.5 w-4.5" />
                                    <div>
                                        <CardTitle className="text-lg">Cycle Metadata</CardTitle>
                                        <CardDescription>Define the cycle identity, status, and overall purpose.</CardDescription>
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
                                        <Label htmlFor="template_id">Appraisal Template</Label>
                                        <Select value={data.template_id} onValueChange={(value) => setData('template_id', value)}>
                                            <SelectTrigger id="template_id" className="h-11">
                                                <SelectValue placeholder="Select template" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {templateOptions.map((option) => (
                                                    <SelectItem key={option.value} value={String(option.value)}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.template_id} />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <Label htmlFor="code">Cycle Code</Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-7 px-2 text-[11px]"
                                                onClick={() => setData('code', buildCycleCode(data.name))}
                                            >
                                                <Sparkles className="mr-1 h-3.5 w-3.5" />
                                                Generate Cycle Code
                                            </Button>
                                        </div>
                                        <Input
                                            id="code"
                                            value={data.code}
                                            onChange={(event) => setData('code', event.target.value.toUpperCase())}
                                            placeholder="ARC-2026-Q1"
                                            className="h-11 uppercase"
                                        />
                                    </div>

                                    <div className="space-y-2 md:col-span-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <Label htmlFor="description">Description</Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-7 px-2 text-[11px]"
                                                onClick={() => setData('description', buildCycleDescription(data))}
                                            >
                                                <Sparkles className="mr-1 h-3.5 w-3.5" />
                                                Generate Description
                                            </Button>
                                        </div>
                                        <textarea
                                            id="description"
                                            className="bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-28 w-full rounded-md border px-3 py-3 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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
                                <CardHeader className="bg-muted/20 border-b">
                                    <div className="flex items-center gap-2">
                                        <CalendarRange className="text-muted-foreground h-4.5 w-4.5" />
                                        <div>
                                            <CardTitle className="text-lg">Evaluation Period</CardTitle>
                                            <CardDescription>Define the active dates for the overall review cycle.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-5 p-6">
                                    <DatePickerField
                                        label="Start Date"
                                        value={data.start_date}
                                        onChange={(value) => setData('start_date', value)}
                                        minDate={today}
                                        error={errors.start_date}
                                    />

                                    <DatePickerField
                                        label="End Date"
                                        value={data.end_date}
                                        onChange={(value) => setData('end_date', value)}
                                        minDate={startDate ?? today}
                                        error={errors.end_date}
                                    />
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm">
                                <CardHeader className="bg-muted/20 border-b">
                                    <div className="flex items-center gap-2">
                                        <Clock3 className="text-muted-foreground h-4.5 w-4.5" />
                                        <div>
                                            <CardTitle className="text-lg">Milestones & Deadlines</CardTitle>
                                            <CardDescription>Set key checkpoints for each phase of the workflow.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-5 p-6">
                                    <DatePickerField
                                        label="Goal Setting Deadline"
                                        value={data.goal_setting_deadline}
                                        onChange={(value) => setData('goal_setting_deadline', value)}
                                        minDate={startDate ?? today}
                                        maxDate={endDate}
                                        error={errors.goal_setting_deadline}
                                    />

                                    <DatePickerField
                                        label="Self-Assessment Deadline"
                                        value={data.self_assessment_deadline}
                                        onChange={(value) => setData('self_assessment_deadline', value)}
                                        minDate={parseDateValue(data.goal_setting_deadline) ?? startDate ?? today}
                                        maxDate={endDate}
                                        error={errors.self_assessment_deadline}
                                    />

                                    <DatePickerField
                                        label="Manager Review Deadline"
                                        value={data.manager_review_deadline}
                                        onChange={(value) => setData('manager_review_deadline', value)}
                                        minDate={
                                            parseDateValue(data.self_assessment_deadline) ??
                                            parseDateValue(data.goal_setting_deadline) ??
                                            startDate ??
                                            today
                                        }
                                        maxDate={endDate}
                                        error={errors.manager_review_deadline}
                                    />

                                    <DatePickerField
                                        label="Approval Deadline"
                                        value={data.approval_deadline}
                                        onChange={(value) => setData('approval_deadline', value)}
                                        minDate={
                                            parseDateValue(data.manager_review_deadline) ??
                                            parseDateValue(data.self_assessment_deadline) ??
                                            parseDateValue(data.goal_setting_deadline) ??
                                            startDate ??
                                            today
                                        }
                                        maxDate={endDate}
                                        error={errors.approval_deadline}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="space-y-6 xl:col-span-4">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <ClipboardList className="text-muted-foreground h-4.5 w-4.5" />
                                    <CardTitle className="text-lg">Cycle Snapshot</CardTitle>
                                </div>
                                <CardDescription>Quick summary of the draft you are preparing.</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-3 text-sm">
                                <div className="bg-muted/20 flex items-center justify-between rounded-lg border px-3 py-2">
                                    <span className="text-muted-foreground">Name</span>
                                    <span className="text-foreground max-w-[55%] truncate text-right font-medium">{data.name || 'Not set'}</span>
                                </div>

                                <div className="bg-muted/20 flex items-center justify-between rounded-lg border px-3 py-2">
                                    <span className="text-muted-foreground">Code</span>
                                    <span className="text-foreground font-medium">{data.code || 'Not set'}</span>
                                </div>

                                <div className="bg-muted/20 flex items-center justify-between rounded-lg border px-3 py-2">
                                    <span className="text-muted-foreground">Status</span>
                                    <span className="text-foreground font-medium">Draft</span>
                                </div>

                                <div className="bg-muted/20 flex items-center justify-between rounded-lg border px-3 py-2">
                                    <span className="text-muted-foreground">Start</span>
                                    <span className="text-foreground font-medium">{formatDate(data.start_date)}</span>
                                </div>

                                <div className="bg-muted/20 flex items-center justify-between rounded-lg border px-3 py-2">
                                    <span className="text-muted-foreground">End</span>
                                    <span className="text-foreground font-medium">{formatDate(data.end_date)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Info className="text-muted-foreground h-4.5 w-4.5" />
                                    <CardTitle className="text-lg">Notes</CardTitle>
                                </div>
                            </CardHeader>

                            <CardContent className="text-muted-foreground space-y-3 text-sm">
                                <div className="bg-muted/20 rounded-lg border p-3">
                                    Use a clear cycle name so employees and managers can identify the review window quickly.
                                </div>
                                <div className="bg-muted/20 rounded-lg border p-3">
                                    Milestone dates should fit within the overall cycle period for a cleaner workflow.
                                </div>
                                <div className="bg-muted/20 rounded-lg border p-3">
                                    This page keeps your existing submit behavior and only upgrades the presentation and date selection.
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex flex-col gap-4 border-t pt-6 md:flex-row md:items-center md:justify-between">
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Info className="h-4 w-4" />
                        <span>All fields stay in draft until you save the review cycle.</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={processing}>
                            <Send className="mr-2 h-4 w-4" />
                            Save Review Cycle
                        </Button>
                    </div>
                </div>
            </form>
        </PerformancePage>
    );
}
