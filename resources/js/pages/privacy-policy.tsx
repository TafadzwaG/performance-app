import PublicSiteShell from '@/components/public-site-shell';
import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Database, Lock, ShieldCheck, Trash2, Users } from 'lucide-react';

const sections = [
    {
        title: 'Information we process',
        icon: Database,
        copy: 'The studio stores account details, employee profile fields, appraisal objectives, ratings, comments, evidence files, development plans, and audit records needed to run your performance cycle.',
    },
    {
        title: 'Why we use it',
        icon: Users,
        copy: 'Data is processed to authenticate users, assign review workflows, calculate scores, produce reports, and maintain a defensible record of performance decisions.',
    },
    {
        title: 'Access controls',
        icon: Lock,
        copy: 'Permissions and roles restrict who can view or change employee records. Managers see their teams, employees see their own appraisals, and HR administrators manage setup and reporting.',
    },
    {
        title: 'Retention',
        icon: Trash2,
        copy: 'Appraisal records, evidence, and audit logs are retained for three years from the relevant cycle or finalization date, unless a longer period is required by law or your organisation\'s policy. Deletion requests should be routed through your HR or system owner.',
    },
    {
        title: 'Security',
        icon: ShieldCheck,
        copy: 'We apply authentication controls, password policies, optional email verification at sign-in, and audit logging to protect sensitive employee information.',
    },
];

export default function PrivacyPolicy() {
    const { auth } = usePage<SharedData>().props;

    return (
        <PublicSiteShell title="Privacy Policy">
            <section className="relative overflow-hidden">
                <div className="bg-hero-photo pointer-events-none absolute inset-0 opacity-80" aria-hidden />
                <div className="relative mx-auto max-w-7xl px-6 pt-10 pb-16 lg:px-10 lg:pt-16 lg:pb-24">
                    <div className="font-mono-brand text-brand-pine mb-6 flex items-center gap-3 text-[11px] tracking-[0.22em] uppercase">
                        <span className="bg-brand-pine inline-block h-px w-8" />
                        <span>Privacy Policy</span>
                    </div>

                    <h1 className="font-display text-balance max-w-3xl text-[clamp(2.5rem,6vw,5rem)] leading-[0.94] font-light tracking-tight">
                        How we handle <span className="text-brand-pine italic">people data</span>.
                    </h1>

                    <p className="text-foreground/75 mt-6 max-w-2xl text-base leading-relaxed lg:text-lg">
                        This policy explains what personal and employment-related information Performance Appraisal Studio
                        processes, why it is needed, and how your organisation remains accountable for its use.
                    </p>

                    <div className="mt-10 flex flex-wrap gap-3">
                        <Button asChild>
                            <Link href={route('privacy-notice')}>
                                Read privacy notice
                                <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={auth.user ? route('dashboard') : route('login')}>
                                {auth.user ? 'Return to dashboard' : 'Sign in'}
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
                <div className="border-foreground/15 grid grid-cols-1 gap-px overflow-hidden rounded-xl border bg-foreground/15 md:grid-cols-2">
                    {sections.map((section) => (
                        <article key={section.title} className="bg-card p-7 lg:p-8">
                            <div className="bg-brand-sand/15 text-brand-pine flex h-11 w-11 items-center justify-center rounded-md">
                                <section.icon className="h-5 w-5" />
                            </div>
                            <h2 className="font-display mt-6 text-2xl">{section.title}</h2>
                            <p className="text-foreground/65 mt-3 text-[13px] leading-relaxed">{section.copy}</p>
                        </article>
                    ))}
                </div>
            </section>
        </PublicSiteShell>
    );
}
