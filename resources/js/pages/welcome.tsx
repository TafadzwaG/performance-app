import { GetStartedPopover, InlineHint } from '@/components/get-started-popover';
import LandingBrandMark from '@/components/landing-brand-mark';
import PublicSiteFooter from '@/components/public-site-footer';
import { Reveal } from '@/components/reveal';
import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    BarChart3,
    CalendarClock,
    CheckCircle2,
    ClipboardList,
    Compass,
    LineChart,
    MoveRight,
    ScrollText,
    ShieldCheck,
    Sparkles,
    Star,
    Target,
    TrendingUp,
    Users,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, XAxis } from 'recharts';

const competencyColors = ['var(--palette-sand)', 'var(--palette-pine)', 'var(--palette-rust)', 'var(--palette-stone)'];

interface PlatformStats {
    has_data: boolean;
    company_values: Array<{
        id: number;
        name: string;
        code: string | null;
        description: string | null;
    }>;
    performance_trend: {
        points: Array<{ month: string; score: number }>;
        ytd_change: number | null;
        sample_size: number;
        period_label: string;
    };
    competency_mix: {
        items: Array<{ name: string; value: number }>;
        pillar_count: number;
    };
    snapshot: {
        score: number | null;
        previous_score: number | null;
        max_score: number;
    };
    goals: {
        completed: number;
        total: number;
        completion_rate: number;
        cycle_label: string | null;
    };
    feedback_velocity: {
        total_this_month: number;
        weekly_counts: number[];
        period_growth_percent: number | null;
    };
}

interface WelcomeProps {
    platformStats?: PlatformStats;
}

const emptyPlatformStats: PlatformStats = {
    has_data: false,
    company_values: [],
    performance_trend: {
        points: [],
        ytd_change: null,
        sample_size: 0,
        period_label: '',
    },
    competency_mix: {
        items: [],
        pillar_count: 0,
    },
    snapshot: {
        score: null,
        previous_score: null,
        max_score: 100,
    },
    goals: {
        completed: 0,
        total: 0,
        completion_rate: 0,
        cycle_label: null,
    },
    feedback_velocity: {
        total_this_month: 0,
        weekly_counts: Array.from({ length: 12 }, () => 0),
        period_growth_percent: null,
    },
};

const cycleSteps = [
    {
        index: '01',
        title: 'Plan',
        copy: 'Set the goals, the cadence, the weightings. Calibrate before the work begins.',
        icon: Target,
        accent: 'var(--palette-sand)',
    },
    {
        index: '02',
        title: 'Track',
        copy: 'Capture evidence as it happens — projects, feedback, KPIs, milestones.',
        icon: LineChart,
        accent: 'var(--palette-pine)',
    },
    {
        index: '03',
        title: 'Review',
        copy: 'Structured conversations grounded in data, not memory. Fair and consistent.',
        icon: ClipboardList,
        accent: 'var(--palette-rust)',
    },
    {
        index: '04',
        title: 'Reward',
        copy: 'Decisions you can defend. Recognition, growth plans, transparent outcomes.',
        icon: Star,
        accent: 'var(--palette-stone)',
    },
];

const features = [
    {
        title: 'Continuous feedback',
        copy: '360° feedback, peer reviews, and self-assessments tied to your values framework.',
        icon: Users,
    },
    {
        title: 'Goal alignment',
        copy: 'Cascade objectives from executive priorities down to individual key results.',
        icon: Compass,
    },
    {
        title: 'Calibrated ratings',
        copy: 'Manager calibration sessions, distribution guardrails, and anti-bias prompts.',
        icon: ShieldCheck,
    },
    {
        title: 'Living development plans',
        copy: 'Coaching notes, skill gap tracking, and learning paths that evolve with the role.',
        icon: ScrollText,
    },
    {
        title: 'Cycle automation',
        copy: 'Quarterly, biannual, or rolling — set the cadence once and let the system orchestrate.',
        icon: CalendarClock,
    },
    {
        title: 'Insight, not noise',
        copy: 'Dashboards built for the people who actually make the decisions.',
        icon: BarChart3,
    },
];

const stats = [
    { value: '4×', label: 'faster review cycles', detail: 'compared to spreadsheets & email threads' },
    { value: '92%', label: 'completion rate', detail: 'across organisations on the platform' },
    { value: '1:1', label: 'evidence to rating', detail: 'every score traceable to an artefact' },
    { value: '0', label: 'lost feedback', detail: 'fully audited, immutable history' },
];

const tickerItems = [
    'GOALS  ▲  ALIGNED',
    'FEEDBACK  ◆  CONTINUOUS',
    'REVIEWS  ●  CALIBRATED',
    'GROWTH  ✶  TRACKED',
    'DECISIONS  ◇  DEFENSIBLE',
    'TEAMS  ▲  HEARD',
];

export default function Welcome({ platformStats: platformStatsProp }: WelcomeProps) {
    const { auth } = usePage<SharedData>().props;
    const platformStats = {
        ...emptyPlatformStats,
        ...platformStatsProp,
        company_values: platformStatsProp?.company_values ?? [],
        performance_trend: {
            ...emptyPlatformStats.performance_trend,
            ...platformStatsProp?.performance_trend,
            points: platformStatsProp?.performance_trend?.points ?? [],
        },
        competency_mix: {
            ...emptyPlatformStats.competency_mix,
            ...platformStatsProp?.competency_mix,
            items: platformStatsProp?.competency_mix?.items ?? [],
        },
        snapshot: {
            ...emptyPlatformStats.snapshot,
            ...platformStatsProp?.snapshot,
        },
        goals: {
            ...emptyPlatformStats.goals,
            ...platformStatsProp?.goals,
        },
        feedback_velocity: {
            ...emptyPlatformStats.feedback_velocity,
            ...platformStatsProp?.feedback_velocity,
            weekly_counts: platformStatsProp?.feedback_velocity?.weekly_counts ?? emptyPlatformStats.feedback_velocity.weekly_counts,
        },
    };
    const companyValues = platformStats.company_values;
    const performanceTrend = platformStats.performance_trend.points;
    const competencyMix = platformStats.competency_mix.items;
    const maxWeeklyFeedback = Math.max(...platformStats.feedback_velocity.weekly_counts, 1);
    const goalBlocksFilled = platformStats.goals.total > 0
        ? Math.round((platformStats.goals.completed / platformStats.goals.total) * 24)
        : 0;

    return (
        <>
            <Head title="Performance, measured with care">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=fraunces:300,400,500,600,700|instrument-sans:400,500,600|jetbrains-mono:400,500"
                    rel="stylesheet"
                />
            </Head>

            <div className="bg-paper text-foreground relative min-h-screen overflow-x-hidden">
                {/* Decorative grain overlay — multiply in light mode, screen in dark */}
                <div className="bg-grain pointer-events-none fixed inset-0 z-0 opacity-20 mix-blend-multiply dark:opacity-25 dark:mix-blend-screen" />

                {/* Full-bleed topographic backdrop — barely-there architectural lines */}
                <div className="bg-topo pointer-events-none fixed inset-0 z-0 opacity-40 dark:opacity-25" />

                {/* ============================================================ NAV */}
                <header className="relative z-20">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 pt-6 lg:px-10 lg:pt-8">
                        <LandingBrandMark />

                        <nav className="font-mono-brand hidden items-center gap-8 text-[11px] tracking-[0.18em] uppercase lg:flex">
                            <a href="#manifesto" className="hover:text-brand-pine dark:hover:text-brand-sand transition-colors">
                                Manifesto
                            </a>
                            <a href="#cycle" className="hover:text-brand-pine dark:hover:text-brand-sand transition-colors">
                                The Cycle
                            </a>
                            <a href="#features" className="hover:text-brand-pine dark:hover:text-brand-sand transition-colors">
                                Features
                            </a>
                            <a href="#metrics" className="hover:text-brand-pine dark:hover:text-brand-sand transition-colors">
                                Metrics
                            </a>
                        </nav>

                        <div className="flex items-center gap-3">
                            {auth.user ? (
                                <Button asChild>
                                    <Link href={route('dashboard')}>
                                        Open dashboard
                                        <ArrowRight className="ml-1" />
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    <Button asChild variant="ghost" className="hidden px-4 text-sm sm:inline-flex">
                                        <Link href={route('login')}>Log in</Link>
                                    </Button>
                                    <Button asChild className="px-4 text-sm">
                                        <Link href={route('login')}>
                                            Enter studio
                                            <ArrowRight className="ml-1" />
                                        </Link>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="bg-foreground/10 mx-auto mt-6 h-px max-w-7xl px-6 lg:px-10" />
                </header>

                {/* ============================================================ HERO */}
                <section className="relative z-10 overflow-hidden">
                    {/* Hero photo — sits behind, fades into white from left to right */}
                    <div className="bg-hero-photo pointer-events-none absolute inset-0 opacity-90" aria-hidden />
                    <div className="relative mx-auto max-w-7xl px-6 pt-10 pb-20 lg:px-10 lg:pt-16 lg:pb-28">
                    <div className="grid grid-cols-12 gap-6 lg:gap-10">
                        {/* Marginalia — left rail */}
                        <aside className="col-span-12 lg:col-span-2">
                            <div className="font-mono-brand text-foreground/55 sticky top-8 space-y-3 text-[10px] tracking-[0.18em] uppercase">
                                <div className="animate-brand-fade flex items-center gap-2">
                                    <span className="bg-brand-pine inline-block h-1.5 w-1.5 animate-brand-pulse-ring rounded-full" />
                                    <span>v 4.0 — 2026 edition</span>
                                </div>
                                <p className="text-foreground/75 max-w-[140px] leading-relaxed normal-case">
                                    A studio for the people who run performance — not a tool that runs them.
                                </p>
                                <div className="text-foreground/40 dotted-divider h-1.5 w-full" />
                                <p>Vol. 01 — Issue 02</p>

                                {companyValues.length > 0 ? (
                                    <>
                                        <div className="text-foreground/40 dotted-divider h-1.5 w-full" />
                                        <div className="space-y-3 pt-1">
                                            <div className="font-mono-brand text-foreground/60 text-[10px] tracking-[0.22em] uppercase">
                                                § Company values
                                            </div>
                                            <ul className="space-y-3 normal-case">
                                                {companyValues.map((value) => (
                                                    <li key={value.id} className="flex items-start gap-2.5">
                                                        <span className="bg-brand-sand mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full" />
                                                        <div className="min-w-0">
                                                            <p className="text-foreground/85 text-[12px] leading-snug font-medium">
                                                                {value.name}
                                                            </p>
                                                            {value.description ? (
                                                                <p className="text-foreground/55 mt-1 text-[11px] leading-relaxed">
                                                                    {value.description}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        </aside>

                        {/* Headline column */}
                        <div className="col-span-12 lg:col-span-8">
                            <div className="font-mono-brand text-brand-pine dark:text-brand-sand mb-6 flex items-center gap-3 text-[11px] tracking-[0.22em] uppercase">
                                <span className="bg-brand-pine dark:bg-brand-sand inline-block h-px w-8" />
                                <span>Performance Management · since 2024</span>
                            </div>

                            <h1 className="font-display text-balance animate-brand-rise text-[clamp(2.75rem,7.5vw,7rem)] leading-[0.92] font-light tracking-tight" style={{ animationDelay: '50ms' }}>
                                Performance,{' '}
                                <span className="text-brand-pine dark:text-brand-sand relative italic">
                                    measured
                                    <svg
                                        viewBox="0 0 240 14"
                                        className="absolute -bottom-2 left-0 w-full"
                                        preserveAspectRatio="none"
                                        aria-hidden
                                    >
                                        <path
                                            d="M2 8 Q 60 -2 120 7 T 238 6"
                                            stroke="var(--palette-sand)"
                                            strokeWidth="3"
                                            fill="none"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </span>{' '}
                                with care.
                            </h1>

                            <Reveal delay={150} variant="rise">
                                <p className="text-foreground/75 mt-8 max-w-xl text-base leading-relaxed lg:text-lg">
                                    A patient, evidence-led system for goals, feedback, calibration, and reviews. Built for
                                    organisations that want appraisals people actually <em className="text-brand-pine dark:text-brand-sand">trust</em>.
                                </p>
                            </Reveal>

                            <Reveal delay={300} variant="rise">
                                <div className="mt-10 flex flex-wrap items-center gap-3">
                                    <Button asChild size="xl" variant="default">
                                        <Link href={auth.user ? route('dashboard') : route('login')}>
                                            {auth.user ? 'Open your dashboard' : 'Begin a cycle'}
                                            <MoveRight />
                                        </Link>
                                    </Button>
                                    <Button asChild size="xl" variant="outline">
                                        <a href="#cycle">See the method</a>
                                    </Button>
                                    <GetStartedPopover triggerVariant="inline" />
                                </div>
                            </Reveal>
                        </div>

                        {/* Rotating seal — right column */}
                        <div className="col-span-12 lg:col-span-2">
                            <div className="relative flex items-start justify-end">
                                <div className="relative h-32 w-32 lg:h-36 lg:w-36">
                                    <svg className="animate-brand-spin-slow absolute inset-0" viewBox="0 0 200 200">
                                        <defs>
                                            <path id="seal" d="M 100, 100 m -78, 0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0" />
                                        </defs>
                                        <text
                                            fontSize="11.5"
                                            fill="var(--palette-ink)"
                                            fontFamily="var(--font-mono)"
                                            letterSpacing="4"
                                        >
                                            <textPath href="#seal">
                                                EVIDENCE · CALIBRATION · GROWTH · TRUST · EVIDENCE · CALIBRATION · GROWTH · TRUST ·
                                            </textPath>
                                        </text>
                                    </svg>
                                    <div className="absolute inset-7 grid place-items-center rounded-full border border-foreground/15">
                                        <Sparkles className="text-brand-pine dark:text-brand-sand h-6 w-6" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats strip */}
                    <div id="metrics" className="border-foreground/15 mt-20 grid grid-cols-2 gap-y-10 border-t pt-10 lg:grid-cols-4 lg:gap-x-10">
                        {stats.map((s, i) => (
                            <Reveal key={s.label} delay={i * 120} variant="rise" className="group relative pl-5">
                                <span className="bg-brand-sand absolute top-1 left-0 inline-block h-3 w-1" />
                                <div className="font-display text-5xl leading-none font-light lg:text-6xl">{s.value}</div>
                                <div className="font-mono-brand text-foreground/60 mt-3 text-[10px] tracking-[0.2em] uppercase">
                                    No. 0{i + 1}
                                </div>
                                <div className="mt-1 text-[13px] font-medium">{s.label}</div>
                                <div className="text-foreground/55 mt-1 text-[12px] leading-snug">{s.detail}</div>
                            </Reveal>
                        ))}
                    </div>
                    </div>
                </section>

                {/* ============================================================ TICKER */}
                <section
                    aria-hidden
                    className="bg-brand-ink text-brand-cream dark:bg-brand-sand dark:text-brand-ink relative z-10 overflow-hidden border-y border-foreground/20 py-5"
                >
                    <div className="animate-brand-marquee flex w-max gap-12 whitespace-nowrap">
                        {[...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems].map((t, i) => (
                            <div key={i} className="font-display flex items-center gap-12 text-2xl tracking-tight">
                                <span
                                    className={
                                        i % 2 === 0
                                            ? 'text-brand-cream dark:text-brand-ink'
                                            : 'text-brand-sand italic dark:text-brand-pine'
                                    }
                                >
                                    {t}
                                </span>
                                <span className="text-brand-sand dark:text-brand-pine">✦</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ============================================================ MANIFESTO */}
                <section id="manifesto" className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
                    <div className="grid grid-cols-12 gap-6 lg:gap-10">
                        <div className="col-span-12 lg:col-span-3">
                            <div className="font-mono-brand text-foreground/60 text-[11px] tracking-[0.22em] uppercase">
                                § Manifesto
                            </div>
                            <div className="bg-brand-sand mt-4 h-px w-12" />
                            <p className="text-foreground/55 font-mono-brand mt-6 max-w-[200px] text-[11px] leading-relaxed">
                                Three commitments. Held in tension. Never traded.
                            </p>
                        </div>
                        <div className="col-span-12 lg:col-span-9">
                            <Reveal variant="rise">
                                <p className="font-display text-balance text-3xl leading-[1.15] font-light lg:text-[2.6rem]">
                                    We believe a fair appraisal is the cheapest thing an organisation can give its people —
                                    and the most expensive thing to do badly. So we built a system that{' '}
                                    <span className="text-brand-pine dark:text-brand-sand italic">refuses to forget</span>, refuses to flatter,
                                    and refuses to be in a hurry.
                                </p>
                            </Reveal>

                            <div className="border-foreground/15 mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-md border bg-foreground/15 md:grid-cols-3">
                                {[
                                    {
                                        n: 'I',
                                        t: 'Evidence over recall',
                                        c: 'Performance is the ledger, not the last conversation. We capture it as it happens.',
                                    },
                                    {
                                        n: 'II',
                                        t: 'Calibrate before crowning',
                                        c: 'Ratings without calibration are vanity. We make calibration the default, not the exception.',
                                    },
                                    {
                                        n: 'III',
                                        t: 'Growth is the goal',
                                        c: 'Reviews end. Development plans continue. We treat appraisals as a beginning, not a verdict.',
                                    },
                                ].map((m, i) => (
                                    <Reveal key={m.n} delay={i * 140} variant="rise" className="bg-card relative p-8">
                                        <div className="font-display text-brand-sand text-7xl leading-none font-light">
                                            {m.n}
                                        </div>
                                        <div className="font-display mt-6 text-xl">{m.t}</div>
                                        <p className="text-foreground/65 mt-3 text-[13px] leading-relaxed">{m.c}</p>
                                    </Reveal>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================================ CYCLE INFOGRAPHIC */}
                <section id="cycle" className="bg-cycle-photo relative z-10 overflow-hidden border-y border-foreground/15">
                    <div className="bg-blueprint pointer-events-none absolute inset-0 opacity-50" aria-hidden />
                    <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
                        <div className="grid grid-cols-12 gap-6 lg:gap-10">
                            <div className="col-span-12 lg:col-span-4">
                                <div className="font-mono-brand text-foreground/60 text-[11px] tracking-[0.22em] uppercase">
                                    § The Cycle
                                </div>
                                <h2 className="font-display text-balance mt-4 text-5xl leading-[0.95] font-light lg:text-6xl">
                                    A four-act method.
                                </h2>
                                <p className="text-foreground/70 mt-6 max-w-md leading-relaxed">
                                    Performance is rarely an event. We treat the cycle as a loop — each act feeding the
                                    next, no act skipped, no act rushed.
                                </p>
                                <div className="mt-10 hidden lg:block">
                                    <CycleDiagram />
                                </div>
                            </div>

                            <div className="col-span-12 lg:col-span-8">
                                <ol className="relative space-y-px overflow-hidden rounded-lg border border-foreground/15 bg-foreground/15">
                                    {cycleSteps.map((step, i) => (
                                        <Reveal
                                            as="li"
                                            key={step.index}
                                            delay={i * 130}
                                            variant="slide-right"
                                            className="bg-card group relative grid grid-cols-12 gap-4 p-6 lg:p-8"
                                        >
                                            <div className="col-span-2 lg:col-span-1">
                                                <span
                                                    className="font-display block text-4xl leading-none font-light lg:text-5xl"
                                                    style={{ color: step.accent }}
                                                >
                                                    {step.index}
                                                </span>
                                            </div>
                                            <div className="col-span-9 lg:col-span-9">
                                                <div className="flex items-center gap-3">
                                                    <step.icon className="text-foreground h-5 w-5" />
                                                    <h3 className="font-display text-2xl lg:text-3xl">{step.title}</h3>
                                                </div>
                                                <p className="text-foreground/70 mt-3 max-w-xl text-[14px] leading-relaxed">
                                                    {step.copy}
                                                </p>
                                            </div>
                                            <div className="col-span-1 flex items-start justify-end">
                                                <ArrowUpRight
                                                    className="text-foreground/30 group-hover:text-brand-pine dark:group-hover:text-brand-sand h-5 w-5 transition-all group-hover:rotate-12"
                                                />
                                            </div>
                                            {i < cycleSteps.length - 1 && (
                                                <div
                                                    aria-hidden
                                                    className="absolute right-8 bottom-0 h-3 w-px translate-y-1/2 bg-foreground/30"
                                                />
                                            )}
                                        </Reveal>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================================ CHARTS / DATA */}
                <section className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
                    <div className="mb-14 grid grid-cols-12 items-end gap-6 lg:gap-10">
                        <div className="col-span-12 lg:col-span-8">
                            <div className="font-mono-brand text-foreground/60 text-[11px] tracking-[0.22em] uppercase">
                                § Read the room
                            </div>
                            <h2 className="font-display text-balance mt-4 text-5xl leading-[0.95] font-light lg:text-6xl">
                                Numbers, kept honest.
                            </h2>
                        </div>
                        <div className="col-span-12 lg:col-span-4">
                            <p className="text-foreground/70 leading-relaxed">
                                Live dashboards for executives, managers, and individual contributors — each cut from
                                the same source of truth in your organisation.
                            </p>
                            {!platformStats.has_data ? (
                                <p className="text-foreground/55 mt-3 text-[12px] italic">
                                    Metrics appear here once review cycles, goals, and feedback are recorded.
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-4 lg:gap-6">
                        {/* Performance trend */}
                        <Reveal variant="slide-right" className="bg-card relative col-span-12 overflow-hidden rounded-xl border border-foreground/12 p-6 lg:col-span-8 lg:p-8">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <div className="font-mono-brand text-foreground/60 text-[10px] tracking-[0.2em] uppercase">
                                        Fig. 01 — Trend
                                    </div>
                                    <div className="font-display mt-2 text-2xl">Organisation-wide performance index</div>
                                </div>
                                <div className="border-brand-pine/40 bg-brand-pine/10 text-brand-pine dark:border-brand-sand/50 dark:bg-brand-sand/15 dark:text-brand-sand flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs">
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    <span className="font-medium">
                                        {platformStats.performance_trend.ytd_change !== null
                                            ? `${platformStats.performance_trend.ytd_change >= 0 ? '+' : ''}${platformStats.performance_trend.ytd_change} pts`
                                            : 'Live trend'}
                                    </span>
                                </div>
                            </div>
                            <div className="-mx-2 h-64">
                                {performanceTrend.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={performanceTrend} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="var(--palette-sand)" stopOpacity={1} />
                                                    <stop offset="100%" stopColor="var(--palette-sand)" stopOpacity={0.55} />
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
                                            <Bar dataKey="score" fill="url(#barFill)" radius={[4, 4, 0, 0]} maxBarSize={42} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-foreground/55 flex h-full items-center justify-center text-sm">
                                        No finalized review scores yet.
                                    </div>
                                )}
                            </div>
                            <div className="font-mono-brand text-foreground/55 mt-2 flex items-center gap-3 text-[10px] tracking-[0.18em] uppercase">
                                <span>{platformStats.performance_trend.period_label}</span>
                                <span className="dotted-divider h-px flex-1 text-foreground/30" />
                                <span>n = {platformStats.performance_trend.sample_size.toLocaleString()}</span>
                            </div>
                        </Reveal>

                        {/* Values pie */}
                        <Reveal delay={120} variant="slide-left" className="bg-card relative col-span-12 overflow-hidden rounded-xl border border-foreground/12 p-6 lg:col-span-4 lg:p-8">
                            <div className="font-mono-brand text-foreground/60 text-[10px] tracking-[0.2em] uppercase">
                                Fig. 02 — Mix
                            </div>
                            <div className="font-display mt-2 text-2xl">Values weighting</div>

                            <div className="relative h-44">
                                {competencyMix.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={competencyMix}
                                                innerRadius={48}
                                                outerRadius={74}
                                                paddingAngle={2}
                                                dataKey="value"
                                                stroke="var(--palette-cream)"
                                                strokeWidth={2}
                                            >
                                                {competencyMix.map((_, i) => (
                                                    <Cell key={i} fill={competencyColors[i % competencyColors.length]} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-foreground/55 flex h-full items-center justify-center px-4 text-center text-sm">
                                        No competency ratings recorded yet.
                                    </div>
                                )}
                                {competencyMix.length > 0 ? (
                                    <div className="pointer-events-none absolute inset-0 grid place-items-center">
                                        <div className="text-center">
                                            <div className="font-display text-3xl leading-none">
                                                {String(platformStats.competency_mix.pillar_count).padStart(2, '0')}
                                            </div>
                                            <div className="font-mono-brand text-foreground/60 mt-0.5 text-[9px] tracking-[0.2em] uppercase">
                                                pillars
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            <ul className="mt-2 space-y-1.5">
                                {competencyMix.length > 0 ? (
                                    competencyMix.map((c, i) => (
                                        <li key={c.name} className="flex items-center justify-between text-[12px]">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="inline-block h-2.5 w-2.5 rounded-sm"
                                                    style={{ background: competencyColors[i % competencyColors.length] }}
                                                />
                                                <span>{c.name}</span>
                                            </div>
                                            <span className="font-mono-brand text-foreground/70">{c.value}%</span>
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-foreground/55 text-[12px]">Waiting for rated competencies.</li>
                                )}
                            </ul>
                        </Reveal>

                        {/* Inline KPI cards */}
                        <Reveal variant="zoom" className="bg-brand-ink text-brand-cream dark:border dark:border-brand-sand/30 relative col-span-12 overflow-hidden rounded-xl p-6 md:col-span-6 lg:col-span-4 lg:p-8">
                            <div className="bg-brand-sand/10 absolute -top-12 -right-12 h-40 w-40 rounded-full blur-2xl" />
                            <div className="font-mono-brand text-brand-cream/60 relative text-[10px] tracking-[0.2em] uppercase">
                                Fig. 03 — Snapshot
                            </div>
                            <div className="font-display relative mt-4 text-6xl leading-none font-light">
                                <span className="text-brand-sand">
                                    {platformStats.snapshot.score !== null
                                        ? Math.round(platformStats.snapshot.score)
                                        : '—'}
                                </span>
                                <span className="text-brand-cream/40 text-3xl">/{platformStats.snapshot.max_score}</span>
                            </div>
                            <p className="text-brand-cream/70 mt-3 text-[13px]">
                                {platformStats.snapshot.score !== null
                                    ? platformStats.snapshot.previous_score !== null
                                        ? `Average effective score this quarter. Up from ${Math.round(platformStats.snapshot.previous_score)} last quarter.`
                                        : 'Average effective score across finalized reviews this quarter.'
                                    : 'Average effective score will appear once reviews are finalized.'}
                            </p>
                            <div className="relative mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                <div
                                    className="bg-brand-sand h-full rounded-full transition-all"
                                    style={{
                                        width: `${platformStats.snapshot.score ?? 0}%`,
                                    }}
                                />
                            </div>
                        </Reveal>

                        {/* Goal completion */}
                        <Reveal delay={120} variant="zoom" className="bg-brand-pine text-brand-cream relative col-span-12 overflow-hidden rounded-xl p-6 md:col-span-6 lg:col-span-4 lg:p-8">
                            <div className="font-mono-brand text-brand-cream/60 text-[10px] tracking-[0.2em] uppercase">
                                Fig. 04 — Goals
                            </div>
                            <div className="font-display mt-4 text-4xl leading-none">
                                {platformStats.goals.total > 0
                                    ? `${platformStats.goals.completed.toLocaleString()} of ${platformStats.goals.total.toLocaleString()}`
                                    : '—'}
                            </div>
                            <p className="text-brand-cream/75 mt-2 text-[13px]">
                                {platformStats.goals.total > 0
                                    ? 'objectives rated or evidenced in the active review cycle'
                                    : 'Goal completion appears once objectives are added to a cycle'}
                            </p>
                            <div className="mt-5 grid grid-cols-12 gap-1">
                                {Array.from({ length: 24 }).map((_, i) => (
                                    <span
                                        key={i}
                                        className={`h-3 rounded-sm ${i < goalBlocksFilled ? 'bg-brand-sand' : 'bg-white/20'}`}
                                    />
                                ))}
                            </div>
                            <div className="font-mono-brand text-brand-cream/70 mt-3 flex items-center justify-between text-[10px] tracking-[0.18em] uppercase">
                                <span>
                                    {platformStats.goals.total > 0
                                        ? `${platformStats.goals.completion_rate}% completion`
                                        : 'No goals yet'}
                                </span>
                                <span>{platformStats.goals.cycle_label ?? 'No active cycle'}</span>
                            </div>
                        </Reveal>

                        {/* Feedback velocity */}
                        <Reveal delay={240} variant="zoom" className="bg-card relative col-span-12 overflow-hidden rounded-xl border border-foreground/12 p-6 md:col-span-12 lg:col-span-4 lg:p-8">
                            <div className="font-mono-brand text-foreground/60 text-[10px] tracking-[0.2em] uppercase">
                                Fig. 05 — Velocity
                            </div>
                            <div className="font-display mt-4 text-4xl leading-none">
                                {platformStats.feedback_velocity.total_this_month.toLocaleString()}
                            </div>
                            <p className="text-foreground/65 mt-2 text-[13px]">comments and feedback entries this month</p>
                            <div className="mt-6 flex h-16 items-end gap-1.5">
                                {platformStats.feedback_velocity.weekly_counts.map((count, i) => (
                                    <div
                                        key={i}
                                        className="bg-brand-rust/70 hover:bg-brand-rust flex-1 rounded-t-sm transition-all"
                                        style={{ height: `${(count / maxWeeklyFeedback) * 100}%` }}
                                    />
                                ))}
                            </div>
                            <div className="font-mono-brand text-foreground/55 mt-3 flex items-center justify-between text-[10px] tracking-[0.18em] uppercase">
                                <span>last 12 weeks</span>
                                <span className="text-brand-rust">
                                    {platformStats.feedback_velocity.period_growth_percent !== null
                                        ? `${platformStats.feedback_velocity.period_growth_percent >= 0 ? '+' : ''}${platformStats.feedback_velocity.period_growth_percent}%`
                                        : '—'}
                                </span>
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* ============================================================ FEATURES */}
                <section id="features" className="bg-feature-photo relative z-10 overflow-hidden border-y border-foreground/10">
                    <div className="bg-dots pointer-events-none absolute inset-0 opacity-40" aria-hidden />
                    <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-28">
                    <div className="mb-14 grid grid-cols-12 gap-6 lg:gap-10">
                        <div className="col-span-12 lg:col-span-6">
                            <div className="font-mono-brand text-foreground/60 flex items-center gap-3 text-[11px] tracking-[0.22em] uppercase">
                                <span>§ The Studio</span>
                                <InlineHint
                                    title="What's in here?"
                                    body="Six surface-level pillars — open the dashboard to see configuration depth, plugins, and integrations."
                                />
                            </div>
                            <h2 className="font-display text-balance mt-4 text-5xl leading-[0.95] font-light lg:text-6xl">
                                Everything an HR team needs — nothing they don't.
                            </h2>
                        </div>
                        <div className="col-span-12 lg:col-span-5 lg:col-start-8 lg:self-end">
                            <p className="text-foreground/70 leading-relaxed">
                                Performance Appraisal Studio is opinionated where opinion matters — and adjustable
                                where it doesn't. Configure once, run forever.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-foreground/15 bg-foreground/15 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((f, i) => (
                            <Reveal
                                as="article"
                                key={f.title}
                                delay={(i % 3) * 100 + Math.floor(i / 3) * 80}
                                variant="rise"
                                className="bg-card group relative flex cursor-pointer flex-col p-7 transition-colors hover:bg-card/95 lg:p-8"
                            >
                                <div className="text-foreground/40 font-mono-brand absolute top-4 right-5 text-[10px] tracking-[0.18em]">
                                    0{i + 1}
                                </div>
                                <div className="bg-brand-sand/15 text-brand-pine dark:text-brand-sand flex h-11 w-11 items-center justify-center rounded-md">
                                    <f.icon className="h-5 w-5" />
                                </div>
                                <h3 className="font-display mt-6 text-2xl">{f.title}</h3>
                                <p className="text-foreground/65 mt-2 text-[13px] leading-relaxed">{f.copy}</p>
                                <div className="border-foreground/10 mt-6 flex items-center gap-2 border-t pt-4 text-[11px] font-medium">
                                    <CheckCircle2 className="text-brand-pine dark:text-brand-sand h-3.5 w-3.5" />
                                    <span className="text-foreground/70">Included in every plan</span>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                    </div>
                </section>

                {/* ============================================================ CTA */}
                <section className="bg-cta-photo text-brand-cream relative z-10 overflow-hidden">
                    <div className="dotted-divider absolute top-0 right-0 left-0 h-px text-brand-cream/30" />
                    <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-6 py-24 lg:gap-10 lg:px-10 lg:py-32">
                        <Reveal variant="rise" className="col-span-12 lg:col-span-7">
                            <div className="font-mono-brand text-brand-cream/55 text-[11px] tracking-[0.22em] uppercase">
                                § Begin
                            </div>
                            <h2 className="font-display text-balance mt-5 text-5xl leading-[0.95] font-light lg:text-7xl">
                                Run the review your people <span className="text-brand-sand italic">deserve</span>.
                            </h2>
                            <p className="text-brand-cream/70 mt-6 max-w-xl leading-relaxed">
                                Start a cycle today — set goals tomorrow, capture evidence next week, calibrate next
                                quarter. The studio holds it all together.
                            </p>

                            <div className="mt-10 flex flex-wrap gap-3">
                                <Button asChild size="xl" variant="secondary">
                                    <Link href={auth.user ? route('dashboard') : route('login')}>
                                        {auth.user ? 'Open dashboard' : 'Enter the studio'}
                                        <MoveRight />
                                    </Link>
                                </Button>
                                <Button asChild size="xl" variant="outline" className="border-brand-cream/30 bg-transparent text-brand-cream hover:bg-brand-cream/10 hover:border-brand-cream/60">
                                    <a href="#manifesto">Re-read the manifesto</a>
                                </Button>
                            </div>
                        </Reveal>

                        <Reveal delay={180} variant="slide-left" className="col-span-12 lg:col-span-5">
                            <div className="border-brand-cream/15 grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-brand-cream/15">
                                {[
                                    { k: 'Cycles run', v: '8,420+' },
                                    { k: 'Org sizes', v: '12 – 12k' },
                                    { k: 'Languages', v: '11' },
                                    { k: 'Uptime', v: '99.98%' },
                                ].map((kv) => (
                                    <div key={kv.k} className="bg-brand-ink/95 p-6 lg:p-7">
                                        <div className="font-display text-brand-sand text-4xl leading-none lg:text-5xl">
                                            {kv.v}
                                        </div>
                                        <div className="font-mono-brand text-brand-cream/60 mt-3 text-[10px] tracking-[0.2em] uppercase">
                                            {kv.k}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* ============================================================ FOOTER */}
                <PublicSiteFooter />

                {/* Floating onboarding popover — sits above everything */}
                <GetStartedPopover triggerVariant="floating" />
            </div>
        </>
    );
}

/* -----------------------------------------------------------
 * Circular cycle diagram (SVG) — decorative
 * ----------------------------------------------------------- */
function CycleDiagram() {
    const size = 220;
    const center = size / 2;
    const radius = 86;
    const steps = ['Plan', 'Track', 'Review', 'Reward'];

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="text-foreground h-56 w-56">
            {/* Outer ring */}
            <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor" strokeOpacity={0.15} />
            <circle cx={center} cy={center} r={radius - 14} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeDasharray="2 4" />

            {/* Arrows */}
            {steps.map((label, i) => {
                const angle = (i / steps.length) * Math.PI * 2 - Math.PI / 2;
                const x = center + Math.cos(angle) * radius;
                const y = center + Math.sin(angle) * radius;
                const colors = ['var(--palette-sand)', 'var(--palette-pine)', 'var(--palette-rust)', 'var(--palette-stone)'];
                return (
                    <g key={label}>
                        <circle cx={x} cy={y} r={9} fill={colors[i]} />
                        <text
                            x={x}
                            y={y - 16}
                            textAnchor="middle"
                            fontSize="10.5"
                            fontFamily="var(--font-mono)"
                            fill="currentColor"
                            letterSpacing="2"
                        >
                            {label.toUpperCase()}
                        </text>
                    </g>
                );
            })}

            {/* Center mark */}
            <circle cx={center} cy={center} r={3} fill="var(--palette-ink)" />
            <text
                x={center}
                y={center + 28}
                textAnchor="middle"
                fontSize="9"
                letterSpacing="3"
                fontFamily="var(--font-mono)"
                fill="currentColor"
                opacity="0.55"
            >
                THE LOOP
            </text>
        </svg>
    );
}
