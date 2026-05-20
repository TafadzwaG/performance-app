import BrandLogo from '@/components/brand-logo';
import ThemedToaster from '@/components/ui/themed-toaster';
import tjtLogo from '@/assets/tjtlogo.png';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, ClipboardList, LineChart, ShieldCheck, Sparkles, Star, Target } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
}

const cyclePillars = [
    { icon: Target, title: 'Plan', copy: 'Goals, weightings, cadence — calibrated before the work begins.' },
    { icon: LineChart, title: 'Track', copy: 'Capture evidence as it happens. No more end-of-cycle memory work.' },
    { icon: ClipboardList, title: 'Review', copy: 'Structured conversations grounded in artefacts, not impressions.' },
    { icon: Star, title: 'Reward', copy: 'Defensible decisions. Recognition, growth, and clarity for everyone.' },
];

export default function AuthLayout({ children, title, description }: AuthLayoutProps) {
    const { name, quote } = usePage<SharedData>().props;

    return (
        <div className="bg-background text-foreground relative grid h-dvh flex-col items-stretch justify-center px-0 sm:px-0 lg:max-w-none lg:grid-cols-[1.05fr_1fr]">
            <ThemedToaster />

            {/* Powered-by chip — top right */}
            <div className="pointer-events-none absolute top-4 right-4 z-40">
                <div className="border-foreground/15 bg-background/85 text-foreground inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs shadow-sm backdrop-blur">
                    <span className="font-mono-brand text-[10px] tracking-[0.2em] uppercase">Powered by</span>
                    <img src={tjtLogo} alt="TJT logo" className="h-6 w-6 object-contain" />
                </div>
            </div>

            {/* ============================================================ LEFT — EDITORIAL BRAND PANEL */}
            <aside className="bg-brand-ink text-brand-cream relative hidden h-full flex-col overflow-hidden p-10 lg:order-2 lg:flex">
                {/* Layered decorative backgrounds — no green overlay */}
                <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(at 22% 18%, rgba(191,180,143,0.22) 0, transparent 55%),' +
                            ' radial-gradient(at 80% 85%, rgba(184,89,59,0.16) 0, transparent 50%),' +
                            ' linear-gradient(135deg, #1d1e1f 0%, #252627 55%, #1a1a1b 100%)',
                    }}
                />
                <div
                    aria-hidden
                    className="absolute inset-0 opacity-25"
                    style={{
                        backgroundImage:
                            'linear-gradient(to right, rgba(191,180,143,0.18) 1px, transparent 1px),' +
                            ' linear-gradient(to bottom, rgba(191,180,143,0.18) 1px, transparent 1px)',
                        backgroundSize: '44px 44px',
                    }}
                />
                <div
                    aria-hidden
                    className="bg-grain absolute inset-0 opacity-30 mix-blend-overlay"
                />

                {/* Marginalia top — system metadata */}
                <div className="relative z-10 flex items-start justify-between">
                    <Link href={route('home')} className="group flex items-center gap-3">
                        <div className="bg-brand-sand text-brand-ink relative flex h-10 w-10 items-center justify-center rounded-md shadow-lg shadow-black/30">
                            <BrandLogo
                                className="size-6 object-contain"
                                iconClassName="size-6 fill-current text-brand-ink"
                            />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="font-display text-brand-cream text-[17px] font-medium tracking-tight">
                                {name ?? 'Performance'}
                            </span>
                            <span className="font-mono-brand text-brand-cream/55 mt-1 text-[9px] tracking-[0.22em] uppercase">
                                Appraisal Studio
                            </span>
                        </div>
                    </Link>

                    {/* Rotating seal */}
                    <div className="relative h-20 w-20">
                        <svg className="animate-brand-spin-slow absolute inset-0" viewBox="0 0 200 200">
                            <defs>
                                <path id="auth-seal" d="M 100,100 m -78,0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0" />
                            </defs>
                            <text fontSize="12" fill="#bfb48f" fontFamily="var(--font-mono)" letterSpacing="4">
                                <textPath href="#auth-seal">
                                    EVIDENCE · CALIBRATION · GROWTH · TRUST ·
                                </textPath>
                            </text>
                        </svg>
                        <div className="border-brand-cream/15 absolute inset-5 grid place-items-center rounded-full border">
                            <Sparkles className="text-brand-sand h-4 w-4" />
                        </div>
                    </div>
                </div>

                {/* Hero copy */}
                <div className="relative z-10 mt-16 max-w-lg">
                    <div className="font-mono-brand text-brand-sand mb-6 flex items-center gap-3 text-[11px] tracking-[0.22em] uppercase">
                        <span className="bg-brand-sand inline-block h-px w-8" />
                        <span>Welcome back</span>
                    </div>

                    <h2 className="font-display text-balance text-5xl leading-[0.95] font-light tracking-tight">
                        Performance, <span className="text-brand-sand italic">measured</span>{' '}
                        with care.
                    </h2>

                    <p className="text-brand-cream/70 mt-6 max-w-md text-[15px] leading-relaxed">
                        Sign in to your appraisal workspace — goals, evidence, calibrated reviews, and growth plans, all
                        held in one patient place.
                    </p>
                </div>

                {/* Cycle pillars — small editorial grid */}
                <div className="relative z-10 mt-12">
                    <div className="font-mono-brand text-brand-cream/55 mb-5 flex items-center gap-3 text-[10px] tracking-[0.22em] uppercase">
                        <span>§ The four-act method</span>
                        <span className="dotted-divider h-px flex-1" style={{ color: 'rgba(246,241,230,0.3)' }} />
                    </div>
                    <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-brand-cream/12 bg-brand-cream/12">
                        {cyclePillars.map((p, i) => (
                            <li key={p.title} className="bg-brand-ink/95 group relative p-4">
                                <div
                                    className="font-display text-brand-sand text-[10px] tracking-[0.2em] uppercase"
                                    style={{ fontFamily: 'var(--font-mono)' }}
                                >
                                    0{i + 1}
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <p.icon className="text-brand-sand h-4 w-4" />
                                    <span className="font-display text-brand-cream text-lg">{p.title}</span>
                                </div>
                                <p className="text-brand-cream/65 mt-2 text-[12px] leading-snug">{p.copy}</p>
                                <ArrowUpRight className="text-brand-cream/25 group-hover:text-brand-sand absolute top-3 right-3 h-3.5 w-3.5 transition-colors" />
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Trust strip */}
                <div className="relative z-10 mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div className="text-brand-cream/70 flex items-center gap-2 text-[12px]">
                        <ShieldCheck className="text-brand-sand h-4 w-4" />
                        <span>Audit-grade evidence trail</span>
                    </div>
                    <div className="text-brand-cream/70 flex items-center gap-2 text-[12px]">
                        <Sparkles className="text-brand-sand h-4 w-4" />
                        <span>Calibration-first by default</span>
                    </div>
                </div>

                {/* Quote / footnote */}
                {quote ? (
                    <div className="relative z-10 mt-auto">
                        <div className="font-mono-brand text-brand-cream/45 mb-3 text-[10px] tracking-[0.22em] uppercase">
                            § Field note
                        </div>
                        <blockquote className="max-w-md">
                            <p className="font-display text-brand-cream/95 text-xl leading-snug italic">
                                &ldquo;{quote.message}&rdquo;
                            </p>
                            <footer className="text-brand-cream/65 mt-4 flex items-center gap-3">
                                <span className="bg-brand-sand inline-block h-px w-8" />
                                <span className="font-mono-brand text-[10px] tracking-[0.22em] uppercase">
                                    {quote.author}
                                </span>
                            </footer>
                        </blockquote>
                    </div>
                ) : (
                    <div className="relative z-10 mt-auto">
                        <div className="font-mono-brand text-brand-cream/45 flex items-center justify-between text-[10px] tracking-[0.22em] uppercase">
                            <span>© 2026 · Performance Studio</span>
                            <span>v 4.0 — 2026 edition</span>
                        </div>
                    </div>
                )}
            </aside>

            {/* ============================================================ RIGHT — FORM PANEL */}
            <main className="relative flex w-full items-center justify-center px-6 py-12 lg:order-1 lg:px-12">
                {/* Subtle topographic backdrop on form side too */}
                <div
                    aria-hidden
                    className="bg-topo pointer-events-none absolute inset-0 opacity-30"
                />

                <div className="relative z-10 mx-auto flex w-full max-w-[440px] flex-col gap-8">
                    {/* Mobile brand mark */}
                    <Link
                        href={route('home')}
                        className="relative z-20 flex items-center justify-center gap-3 lg:hidden"
                    >
                        <div className="bg-brand-ink relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-md shadow-lg">
                            <div className="bg-brand-sand absolute inset-1.5 rounded-[3px]" />
                            <BrandLogo
                                className="relative size-5 object-contain"
                                iconClassName="relative size-5 fill-current text-brand-ink"
                            />
                        </div>
                        <span className="font-display text-foreground text-lg tracking-tight">
                            {name ?? 'Performance Studio'}
                        </span>
                    </Link>

                    {/* Eyebrow */}
                    <div className="font-mono-brand text-foreground/55 flex items-center gap-3 text-[10px] tracking-[0.22em] uppercase">
                        <span className="bg-brand-sand inline-block h-px w-6" />
                        <span>§ Access</span>
                    </div>

                    {/* Headline */}
                    <header className="flex flex-col gap-3">
                        <h1 className="font-display text-balance text-foreground text-[2.25rem] leading-[1.05] font-light tracking-tight lg:text-[2.5rem]">
                            {title}
                        </h1>
                        {description ? (
                            <p className="text-foreground/65 max-w-md text-[14px] leading-relaxed">
                                {description}
                            </p>
                        ) : null}
                    </header>

                    {/* Form slot */}
                    <div className="grid gap-6">{children}</div>

                    {/* Legal */}
                    <p className="text-foreground/55 mt-2 text-center text-[12px] leading-relaxed sm:text-left">
                        By continuing, you agree to our{' '}
                        <Link href="/terms" className="text-foreground hover:text-brand-pine underline underline-offset-4 decoration-brand-sand decoration-2">
                            Terms of Service
                        </Link>{' '}
                        and performance data usage policies.
                    </p>
                </div>
            </main>
        </div>
    );
}
