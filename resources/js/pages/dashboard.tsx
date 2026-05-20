import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    CalendarClock,
    CheckCircle2,
    ClipboardList,
    LineChart as LineChartIcon,
    MoveRight,
    Target,
    TrendingUp,
    Users,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, XAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

const performanceTrend = [
    { month: 'Jan', score: 62 },
    { month: 'Feb', score: 68 },
    { month: 'Mar', score: 71 },
    { month: 'Apr', score: 74 },
    { month: 'May', score: 78 },
    { month: 'Jun', score: 81 },
    { month: 'Jul', score: 84 },
    { month: 'Aug', score: 87 },
];

const ratingDistribution = [
    { name: 'Exceeds', value: 18 },
    { name: 'Meets', value: 64 },
    { name: 'Developing', value: 14 },
    { name: 'Below', value: 4 },
];

const ratingColors = ['var(--palette-pine)', 'var(--palette-sand)', 'var(--palette-stone)', 'var(--palette-rust)'];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-5 p-4 lg:p-6">
                {/* Greeting strip */}
                <section className="bg-card border-foreground/12 relative overflow-hidden rounded-xl border p-6 lg:p-8">
                    <div className="bg-brand-sand/15 absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl" />
                    <div className="relative grid grid-cols-12 items-end gap-4">
                        <div className="col-span-12 lg:col-span-8">
                            <div className="font-mono-brand text-foreground/60 text-[11px] tracking-[0.22em] uppercase">
                                § Q3 · 2026 cycle
                            </div>
                            <h1 className="font-display text-balance mt-3 text-4xl leading-[1] font-light lg:text-5xl">
                                Welcome back. <span className="text-brand-pine italic">Eight reviews</span> are waiting on you.
                            </h1>
                            <p className="text-foreground/65 mt-4 max-w-xl text-[14px] leading-relaxed">
                                Calibration window opens in 12 days. Capture any outstanding evidence and finalise self-assessments before then.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-2">
                                <Button asChild>
                                    <Link href="#">
                                        Open pending reviews <MoveRight />
                                    </Link>
                                </Button>
                                <Button asChild variant="accent">
                                    <Link href="#">Start a calibration</Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href="#">View cycle plan</Link>
                                </Button>
                            </div>
                        </div>
                        <div className="col-span-12 lg:col-span-4">
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Reviews pending', value: '8', tint: 'bg-brand-sand/20 text-brand-ink' },
                                    { label: 'Goals on track', value: '92%', tint: 'bg-brand-pine/15 text-brand-pine' },
                                    { label: 'Feedback this wk', value: '34', tint: 'bg-brand-rust/15 text-brand-rust' },
                                    { label: 'Calibration in', value: '12d', tint: 'bg-foreground/10 text-foreground' },
                                ].map((m) => (
                                    <div key={m.label} className={`rounded-lg p-3 ${m.tint}`}>
                                        <div className="font-display text-3xl leading-none">{m.value}</div>
                                        <div className="font-mono-brand mt-2 text-[9px] tracking-[0.2em] uppercase opacity-75">
                                            {m.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* KPI row */}
                <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[
                        { icon: Target, label: 'Active goals', value: '348', delta: '+22 this cycle', tone: 'brand-sand' },
                        { icon: Users, label: 'People reviewed', value: '1,284', delta: '92% completion', tone: 'brand-pine' },
                        { icon: ClipboardList, label: 'Open feedback', value: '146', delta: '↑ 12% vs last wk', tone: 'brand-rust' },
                        { icon: CalendarClock, label: 'Cycle status', value: 'On track', delta: 'Calibration · 12d', tone: 'brand-stone' },
                    ].map((k) => (
                        <article key={k.label} className="bg-card border-foreground/12 group relative overflow-hidden rounded-xl border p-5">
                            <div className="flex items-start justify-between">
                                <div className="bg-foreground/5 text-foreground flex h-9 w-9 items-center justify-center rounded-md">
                                    <k.icon className="h-4 w-4" />
                                </div>
                                <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ background: `var(--palette-${k.tone.replace('brand-', '')})` }}
                                />
                            </div>
                            <div className="font-mono-brand text-foreground/60 mt-5 text-[10px] tracking-[0.2em] uppercase">
                                {k.label}
                            </div>
                            <div className="font-display mt-1 text-3xl">{k.value}</div>
                            <div className="text-foreground/65 mt-1 text-[12px]">{k.delta}</div>
                        </article>
                    ))}
                </section>

                {/* Charts */}
                <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="bg-card border-foreground/12 relative overflow-hidden rounded-xl border p-6 lg:col-span-2">
                        <div className="mb-2 flex items-start justify-between">
                            <div>
                                <div className="font-mono-brand text-foreground/60 text-[10px] tracking-[0.2em] uppercase">
                                    Fig. 01 — Trend
                                </div>
                                <div className="font-display mt-1 text-2xl">Performance index · YTD</div>
                            </div>
                            <div className="border-brand-pine/40 bg-brand-pine/10 text-brand-pine flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs">
                                <TrendingUp className="h-3.5 w-3.5" />
                                <span className="font-medium">+22 pts</span>
                            </div>
                        </div>
                        <div className="-mx-2 h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={performanceTrend} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="dashboardBar" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--palette-sand)" stopOpacity={1} />
                                            <stop offset="100%" stopColor="var(--palette-sand)" stopOpacity={0.5} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid stroke="var(--palette-ink)" strokeOpacity={0.06} vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        stroke="var(--palette-ink)"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontSize: 11, fill: 'var(--palette-ink)', opacity: 0.65 }}
                                    />
                                    <Bar dataKey="score" fill="url(#dashboardBar)" radius={[4, 4, 0, 0]} maxBarSize={48} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-card border-foreground/12 relative overflow-hidden rounded-xl border p-6">
                        <div className="font-mono-brand text-foreground/60 text-[10px] tracking-[0.2em] uppercase">
                            Fig. 02 — Mix
                        </div>
                        <div className="font-display mt-1 text-2xl">Rating distribution</div>

                        <div className="relative h-44">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={ratingDistribution}
                                        innerRadius={48}
                                        outerRadius={72}
                                        paddingAngle={2}
                                        dataKey="value"
                                        stroke="var(--palette-cream)"
                                        strokeWidth={2}
                                    >
                                        {ratingDistribution.map((_, i) => (
                                            <Cell key={i} fill={ratingColors[i]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="pointer-events-none absolute inset-0 grid place-items-center">
                                <div className="text-center">
                                    <div className="font-display text-3xl leading-none">1,284</div>
                                    <div className="font-mono-brand text-foreground/60 mt-0.5 text-[9px] tracking-[0.2em] uppercase">
                                        reviewed
                                    </div>
                                </div>
                            </div>
                        </div>

                        <ul className="mt-2 space-y-1.5">
                            {ratingDistribution.map((c, i) => (
                                <li key={c.name} className="flex items-center justify-between text-[12px]">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="inline-block h-2.5 w-2.5 rounded-sm"
                                            style={{ background: ratingColors[i] }}
                                        />
                                        <span>{c.name}</span>
                                    </div>
                                    <span className="font-mono-brand text-foreground/70">{c.value}%</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* Tasks list */}
                <section className="bg-card border-foreground/12 overflow-hidden rounded-xl border">
                    <header className="border-foreground/12 flex items-center justify-between border-b p-5">
                        <div>
                            <div className="font-mono-brand text-foreground/60 text-[10px] tracking-[0.2em] uppercase">
                                § Up next
                            </div>
                            <div className="font-display mt-1 text-2xl">Your queue this week</div>
                        </div>
                        <Button variant="ghost" size="sm">
                            View all <ArrowUpRight className="ml-1" />
                        </Button>
                    </header>
                    <ul className="divide-foreground/10 divide-y">
                        {[
                            { who: 'Liyana M.', task: 'Self-assessment — Q3 cycle', due: 'Due Fri', status: 'pending', icon: ClipboardList },
                            { who: 'Tendai N.', task: 'Goal review · 4 objectives', due: 'Due Mon', status: 'in progress', icon: Target },
                            { who: 'You', task: 'Calibration prep · Engineering', due: 'Due in 6 days', status: 'upcoming', icon: LineChartIcon },
                            { who: 'Amara K.', task: 'Manager review — final sign-off', due: 'Overdue', status: 'overdue', icon: CheckCircle2 },
                        ].map((row, i) => (
                            <li key={i} className="hover:bg-secondary/15 grid grid-cols-12 items-center gap-3 p-5 transition-colors">
                                <div className="col-span-1">
                                    <div className="bg-foreground/5 text-foreground flex h-9 w-9 items-center justify-center rounded-md">
                                        <row.icon className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="col-span-7 lg:col-span-8">
                                    <div className="font-display text-lg">{row.task}</div>
                                    <div className="text-foreground/55 text-[12px]">Owner · {row.who}</div>
                                </div>
                                <div className="col-span-3 lg:col-span-2 text-right text-[12px]">
                                    <div className="font-mono-brand text-foreground/70">{row.due}</div>
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    <Button
                                        size="sm"
                                        variant={
                                            row.status === 'overdue'
                                                ? 'destructive'
                                                : row.status === 'pending'
                                                  ? 'warning'
                                                  : row.status === 'in progress'
                                                    ? 'accent'
                                                    : 'soft'
                                        }
                                    >
                                        Open
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </AppLayout>
    );
}
