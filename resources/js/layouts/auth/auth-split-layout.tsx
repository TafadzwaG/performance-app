import AppLogoIcon from '@/components/app-logo-icon';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';

interface AuthLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
}

export default function AuthLayout({ children, title, description }: AuthLayoutProps) {
    const { name, quote } = usePage<SharedData>().props;

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center bg-white px-8 dark:bg-zinc-950 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            {/* Left Side: Brand / Performance Appraisal Message */}
            <div className="relative hidden h-full flex-col overflow-hidden p-10 text-white lg:flex dark:border-r border-zinc-800">
                <div className="absolute inset-0 bg-[#09090b]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_35%)]" />

                <Link href={route('home')} className="relative z-20 flex items-center text-xl font-semibold tracking-tight">
                    <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-500/20">
                        <AppLogoIcon className="size-6 fill-current text-white" />
                    </div>
                    <span>{name ?? 'Performance Appraisal System'}</span>
                </Link>

                <div className="relative z-20 mt-20 max-w-xl">
                    <div className="mb-4 inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20">
                        Performance Management Platform
                    </div>

                    <h2 className="text-4xl font-semibold leading-tight tracking-tight">
                        Build a culture of continuous feedback and measurable growth.
                    </h2>

                    <p className="mt-6 text-base leading-7 text-zinc-300">
                        Manage employee goals, appraisal cycles, self-assessments, manager reviews, and performance
                        insights from one secure workspace.
                    </p>

                    <div className="mt-10 grid gap-4">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-300">
                                Goal Alignment
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-zinc-300">
                                Link individual objectives to team and organizational priorities.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
                                Review Cycles
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-zinc-300">
                                Simplify quarterly and annual appraisals with structured workflows.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-300">
                                Actionable Insights
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-zinc-300">
                                Identify strengths, development areas, and readiness for growth opportunities.
                            </p>
                        </div>
                    </div>
                </div>

                {quote && (
                    <div className="relative z-20 mt-auto max-w-md">
                        <blockquote className="space-y-4">
                            <p className="text-lg leading-relaxed font-light italic text-zinc-200">
                                &ldquo;{quote.message}&rdquo;
                            </p>
                            <footer className="flex items-center gap-3">
                                <div className="h-px w-8 bg-blue-500" />
                                <span className="text-sm font-medium uppercase tracking-wide text-neutral-400">
                                    {quote.author}
                                </span>
                            </footer>
                        </blockquote>
                    </div>
                )}
            </div>

            {/* Right Side: Auth Form */}
            <div className="w-full lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[420px]">
                    <Link href={route('home')} className="relative z-20 flex items-center justify-center lg:hidden">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-xl">
                            <AppLogoIcon className="size-8 fill-current text-white" />
                        </div>
                    </Link>

                    <div className="flex flex-col gap-3 text-center sm:text-left">
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h1>
                        <p className="text-base text-muted-foreground">{description}</p>
                    </div>

                    <div className="grid gap-6">{children}</div>

                    <p className="px-4 text-center text-sm text-muted-foreground">
                        By continuing, you agree to our{' '}
                        <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                            Terms of Service
                        </Link>{' '}
                        and performance data usage policies.
                    </p>
                </div>
            </div>
        </div>
    );
}