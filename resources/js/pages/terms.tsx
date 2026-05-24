import PublicSiteShell from '@/components/public-site-shell';
import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, FileText, Scale, ShieldCheck } from 'lucide-react';

const termsSections = [
    {
        title: 'Access and accounts',
        copy: 'Access to the studio is provided through an approved user account. You are responsible for keeping your sign-in details private and for activity performed under your account.',
    },
    {
        title: 'Performance data',
        copy: 'The platform stores review cycles, objectives, ratings, feedback, evidence, development plans, and audit records so appraisal decisions remain traceable and consistent. Records are retained for three years unless a longer period is required by law or organisational policy.',
    },
    {
        title: 'Acceptable use',
        copy: 'Use the system for lawful workplace performance management only. Do not upload unlawful, misleading, discriminatory, confidential third-party, or harmful content.',
    },
    {
        title: 'Manager and HR responsibilities',
        copy: 'Managers, HR administrators, and approvers remain responsible for fair process, accurate inputs, appropriate calibration, and compliance with internal employment policies.',
    },
    {
        title: 'Availability and changes',
        copy: 'We may improve, adjust, or retire features as the service evolves. Planned maintenance and operational updates may occasionally affect availability.',
    },
    {
        title: 'Limits of the service',
        copy: 'The studio supports structured performance decisions, but it does not replace professional HR, legal, or employment advice for specific employee matters.',
    },
];

const commitments = [
    'Evidence remains attached to appraisal decisions.',
    'Audit trails preserve important workflow activity.',
    'Role-based access controls protect sensitive employee records.',
];

export default function Terms() {
    const { auth } = usePage<SharedData>().props;

    return (
        <PublicSiteShell title="Terms of Service">
            <section className="relative overflow-hidden">
                        <div className="bg-hero-photo pointer-events-none absolute inset-0 opacity-80" aria-hidden />
                        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 pt-10 pb-18 lg:grid-cols-12 lg:gap-10 lg:px-10 lg:pt-16 lg:pb-24">
                            <aside className="min-w-0 lg:col-span-2">
                                <div className="font-mono-brand text-foreground/55 sticky top-8 space-y-3 text-[10px] tracking-[0.18em] uppercase">
                                    <div className="animate-brand-fade flex items-center gap-2">
                                        <span className="bg-brand-pine inline-block h-1.5 w-1.5 animate-brand-pulse-ring rounded-full" />
                                        <span>Terms of Service</span>
                                    </div>
                                    <p className="text-foreground/75 max-w-[150px] leading-relaxed normal-case">
                                        The plain operating agreement for using Performance Appraisal Studio.
                                    </p>
                                    <div className="text-foreground/40 dotted-divider h-1.5 w-full" />
                                    <p>Updated May 2026</p>
                                </div>
                            </aside>

                            <div className="min-w-0 lg:col-span-7">
                                <div className="font-mono-brand text-brand-pine mb-6 flex items-center gap-3 text-[11px] tracking-[0.22em] uppercase">
                                    <span className="bg-brand-pine inline-block h-px w-8" />
                                    <span>Legal terms and fair use</span>
                                </div>

                                <h1 className="font-display text-balance animate-brand-rise text-[clamp(2.75rem,7vw,6.5rem)] leading-[0.92] font-light tracking-tight">
                                    Terms, written with{' '}
                                    <span className="text-brand-pine relative italic">
                                        clarity
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
                                    </span>
                                    .
                                </h1>

                                <p className="text-foreground/75 mt-8 max-w-2xl text-base leading-relaxed lg:text-lg">
                                    These terms explain how Performance Appraisal Studio should be used, what information it
                                    helps manage, and where responsibility stays with your organisation.
                                </p>

                                <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                                    <Button asChild size="xl" className="w-full max-w-[21.5rem] sm:w-auto sm:max-w-none">
                                        <Link href={auth.user ? route('dashboard') : route('login')}>
                                            {auth.user ? 'Return to dashboard' : 'Continue to sign in'}
                                            <ArrowRight />
                                        </Link>
                                    </Button>
                                    <Button asChild size="xl" variant="outline" className="w-full max-w-[21.5rem] sm:w-auto sm:max-w-none">
                                        <Link href="/">Back to welcome</Link>
                                    </Button>
                                </div>
                            </div>

                            <div className="min-w-0 lg:col-span-3">
                                <div className="border-foreground/15 bg-card/90 relative w-full max-w-[21.5rem] overflow-hidden rounded-xl border p-6 shadow-sm backdrop-blur sm:max-w-none">
                                    <div className="bg-brand-sand/20 absolute -top-12 -right-10 h-32 w-32 rounded-full blur-2xl" />
                                    <div className="bg-brand-sand/15 text-brand-pine relative flex h-12 w-12 items-center justify-center rounded-md">
                                        <Scale className="h-6 w-6" />
                                    </div>
                                    <div className="font-mono-brand text-foreground/60 relative mt-6 text-[10px] tracking-[0.2em] uppercase">
                                        Service standard
                                    </div>
                                    <p className="font-display relative mt-3 text-3xl leading-tight">
                                        Fair process needs clear records.
                                    </p>
                                    <ul className="relative mt-5 space-y-3">
                                        {commitments.map((commitment) => (
                                            <li key={commitment} className="flex min-w-0 gap-2 text-[13px] leading-relaxed text-foreground/70">
                                                <CheckCircle2 className="text-brand-pine mt-0.5 h-4 w-4 shrink-0" />
                                                <span className="min-w-0">{commitment}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-brand-ink text-brand-cream relative z-10 overflow-hidden border-y border-foreground/20 py-5">
                        <div className="animate-brand-marquee flex w-max gap-12 whitespace-nowrap">
                            {[
                                'ACCESS',
                                'EVIDENCE',
                                'CALIBRATION',
                                'AUDIT',
                                'RESPONSIBILITY',
                                'TRUST',
                                'ACCESS',
                                'EVIDENCE',
                                'CALIBRATION',
                                'AUDIT',
                                'RESPONSIBILITY',
                                'TRUST',
                            ].map((item, index) => (
                                <div key={`${item}-${index}`} className="font-display flex items-center gap-12 text-2xl tracking-tight">
                                    <span className={index % 2 === 0 ? 'text-brand-cream' : 'text-brand-sand italic'}>{item}</span>
                                    <span className="text-brand-sand">*</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="relative z-10 mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10">
                            <div className="min-w-0 lg:col-span-3">
                                <div className="font-mono-brand text-foreground/60 text-[11px] tracking-[0.22em] uppercase">
                                    Section 01
                                </div>
                                <div className="bg-brand-sand mt-4 h-px w-12" />
                                <p className="text-foreground/55 font-mono-brand mt-6 max-w-[220px] text-[11px] leading-relaxed">
                                    Read this as a practical operating guide, not a replacement for your internal HR policy.
                                </p>
                            </div>

                            <div className="min-w-0 lg:col-span-9">
                                <p className="font-display text-balance text-3xl leading-[1.15] font-light lg:text-[2.6rem]">
                                    By using the studio, you agree to keep appraisal activity fair, accurate, lawful, and
                                    grounded in evidence that people can understand.
                                </p>

                                <div className="border-foreground/15 mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-lg border bg-foreground/15 md:grid-cols-2">
                                    {termsSections.map((section, index) => (
                                        <article key={section.title} className="bg-card group relative p-7 lg:p-8">
                                            <div className="text-foreground/40 font-mono-brand absolute top-4 right-5 text-[10px] tracking-[0.18em]">
                                                0{index + 1}
                                            </div>
                                            <div className="bg-brand-sand/15 text-brand-pine flex h-11 w-11 items-center justify-center rounded-md">
                                                {index % 2 === 0 ? <FileText className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                                            </div>
                                            <h2 className="font-display mt-6 text-2xl">{section.title}</h2>
                                            <p className="text-foreground/65 mt-3 text-[13px] leading-relaxed">{section.copy}</p>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-cta-photo text-brand-cream relative z-10 overflow-hidden">
                        <div className="dotted-divider absolute top-0 right-0 left-0 h-px text-brand-cream/30" />
                        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-20 lg:grid-cols-12 lg:gap-10 lg:px-10 lg:py-28">
                            <div className="min-w-0 lg:col-span-7">
                                <div className="font-mono-brand text-brand-cream/55 text-[11px] tracking-[0.22em] uppercase">
                                    Questions
                                </div>
                                <h2 className="font-display text-balance mt-5 text-5xl leading-[0.95] font-light lg:text-7xl">
                                    Keep the record <span className="text-brand-sand italic">clean</span>.
                                </h2>
                                <p className="text-brand-cream/70 mt-6 max-w-xl leading-relaxed">
                                    If a term conflicts with a signed agreement or internal policy, use the signed agreement
                                    or policy as the source of truth for your organisation.
                                </p>
                            </div>

                            <div className="min-w-0 self-end lg:col-span-5">
                                <div className="border-brand-cream/15 bg-brand-ink/95 rounded-lg border p-6 lg:p-8">
                                    <div className="font-mono-brand text-brand-cream/60 text-[10px] tracking-[0.2em] uppercase">
                                        Last reviewed
                                    </div>
                                    <div className="font-display text-brand-sand mt-4 text-5xl leading-none">May 2026</div>
                                    <p className="text-brand-cream/70 mt-4 text-sm leading-relaxed">
                                        These terms are maintained for the Performance Appraisal Studio application.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
        </PublicSiteShell>
    );
}
