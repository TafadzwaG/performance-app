import BrandLogo from '@/components/brand-logo';
import ThemedToaster from '@/components/ui/themed-toaster';
import performanceImage from '@/assets/performance.png';
import tjtLogo from '@/assets/tjtlogo.png';
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
        <div className="relative grid h-dvh flex-col items-center justify-center bg-background px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <ThemedToaster />
            <div className="pointer-events-none absolute right-4 top-4 z-30">
                <div className="inline-flex items-center gap-2 rounded-md border border-border bg-background/90 px-2.5 py-1.5 text-xs text-foreground shadow-sm backdrop-blur">
                    <span className="font-medium">Powered By</span>
                    <img src={tjtLogo} alt="TJT logo" className="h-7 w-7 object-contain" />
                </div>
            </div>

            {/* Left Side: Brand / Performance Appraisal Message */}
            <div className="relative hidden h-full flex-col overflow-hidden border-r border-border p-10 text-primary-foreground lg:order-2 lg:flex">
                <img
                    src={performanceImage}
                    alt="Performance appraisal workspace"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-[#385144]/85" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(248,245,242,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(248,245,242,0.08)_1px,transparent_1px)] bg-[size:24px_24px]" />

                <Link href={route('home')} className="relative z-20 flex items-center text-xl font-semibold tracking-tight">
                    <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#f8f5f2] shadow-lg shadow-black/20">
                        <BrandLogo className="size-6 object-contain" iconClassName="size-6 fill-current text-[#385144]" />
                    </div>
                    <span>{name ?? 'Performance Appraisal System'}</span>
                </Link>

                <div className="relative z-20 mt-20 max-w-xl">
                    <div className="mb-4 inline-flex items-center rounded-full bg-[#f8f5f2]/10 px-3 py-1 text-xs font-medium text-[#f8f5f2] ring-1 ring-inset ring-[#f8f5f2]/30">
                        Performance Management Platform
                    </div>

                    <h2 className="text-4xl font-semibold leading-tight tracking-tight">
                        Build a culture of continuous feedback and measurable growth.
                    </h2>

                    <p className="mt-6 text-base leading-7 text-[#f8f5f2]/90">
                        Manage employee goals, appraisal cycles, self-assessments, manager reviews, and performance
                        insights from one secure workspace.
                    </p>

                    <div className="mt-10 grid gap-4">
                        <div className="rounded-2xl border border-[#f8f5f2]/20 bg-[#f8f5f2]/10 p-4 backdrop-blur-sm">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#f8f5f2]">
                                Goal Alignment
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-[#f8f5f2]/85">
                                Link individual objectives to team and organizational priorities.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[#f8f5f2]/20 bg-[#f8f5f2]/10 p-4 backdrop-blur-sm">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#f8f5f2]">
                                Review Cycles
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-[#f8f5f2]/85">
                                Simplify quarterly and annual appraisals with structured workflows.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[#f8f5f2]/20 bg-[#f8f5f2]/10 p-4 backdrop-blur-sm">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#f8f5f2]">
                                Actionable Insights
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-[#f8f5f2]/85">
                                Identify strengths, development areas, and readiness for growth opportunities.
                            </p>
                        </div>
                    </div>
                </div>

                {quote && (
                    <div className="relative z-20 mt-auto max-w-md">
                        <blockquote className="space-y-4">
                            <p className="text-lg leading-relaxed font-light italic text-[#f8f5f2]/95">
                                &ldquo;{quote.message}&rdquo;
                            </p>
                            <footer className="flex items-center gap-3">
                                <div className="h-px w-8 bg-[#f8f5f2]" />
                                <span className="text-sm font-medium uppercase tracking-wide text-[#f8f5f2]/80">
                                    {quote.author}
                                </span>
                            </footer>
                        </blockquote>
                    </div>
                )}
            </div>

            {/* Right Side: Auth Form */}
            <div className="w-full lg:order-1 lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[420px]">
                    <Link href={route('home')} className="relative z-20 flex items-center justify-center lg:hidden">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-xl">
                            <BrandLogo className="size-8 object-contain" iconClassName="size-8 fill-current text-primary-foreground" />
                        </div>
                    </Link>

                    <div className="flex flex-col gap-3 text-center sm:text-left">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
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
