import PublicSiteShell from '@/components/public-site-shell';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { ArrowRight, Eye, FileText, Mail, UserCheck } from 'lucide-react';

const noticeItems = [
    {
        title: 'Controller',
        copy: 'Your employer or deploying organisation is the data controller for employee records in the studio. The platform operator processes data on their instructions.',
    },
    {
        title: 'Categories of data',
        copy: 'Identity and contact details, employment attributes, appraisal content, uploaded evidence, workflow actions, and technical audit logs.',
    },
    {
        title: 'Your choices',
        copy: 'Workplace performance data is collected because your organisation runs a formal appraisal programme. Contact your HR team for access, correction, or deletion requests.',
    },
    {
        title: 'Retention',
        copy: 'Performance appraisal records are kept for three years, after which they may be deleted or anonymised according to your organisation\'s retention schedule and applicable law.',
    },
    {
        title: 'Recipients',
        copy: 'Authorised managers, approvers, HR administrators, and support staff with a legitimate need may access records according to assigned permissions.',
    },
];

export default function PrivacyNotice() {
    return (
        <PublicSiteShell title="Privacy Notice">
            <section className="relative overflow-hidden">
                <div className="bg-hero-photo pointer-events-none absolute inset-0 opacity-80" aria-hidden />
                <div className="relative mx-auto max-w-7xl px-6 pt-10 pb-16 lg:px-10 lg:pt-16 lg:pb-24">
                    <div className="font-mono-brand text-brand-pine mb-6 flex items-center gap-3 text-[11px] tracking-[0.22em] uppercase">
                        <span className="bg-brand-pine inline-block h-px w-8" />
                        <span>Privacy Notice</span>
                    </div>

                    <h1 className="font-display text-balance max-w-3xl text-[clamp(2.5rem,6vw,5rem)] leading-[0.94] font-light tracking-tight">
                        A concise notice for <span className="text-brand-pine italic">employees</span>.
                    </h1>

                    <p className="text-foreground/75 mt-6 max-w-2xl text-base leading-relaxed lg:text-lg">
                        This notice summarises how your personal data may be used when you sign in, complete your profile,
                        and participate in performance reviews inside the studio.
                    </p>

                    <div className="mt-10 flex flex-wrap gap-3">
                        <Button asChild variant="outline">
                            <Link href={route('privacy-policy')}>
                                <FileText className="mr-2 h-4 w-4" />
                                Full privacy policy
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={route('support')}>
                                Contact support
                                <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
                <div className="grid gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                        <div className="space-y-6">
                            {noticeItems.map((item) => (
                                <article key={item.title} className="border-foreground/15 bg-card rounded-xl border p-6">
                                    <h2 className="font-display text-xl">{item.title}</h2>
                                    <p className="text-foreground/65 mt-3 text-sm leading-relaxed">{item.copy}</p>
                                </article>
                            ))}
                        </div>
                    </div>

                    <aside className="lg:col-span-5">
                        <div className="border-foreground/15 bg-card sticky top-8 space-y-5 rounded-xl border p-6 shadow-sm">
                            <div className="bg-brand-sand/15 text-brand-pine flex h-12 w-12 items-center justify-center rounded-md">
                                <Eye className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="font-display text-2xl">At sign-in</h2>
                                <p className="text-foreground/65 mt-3 text-sm leading-relaxed">
                                    We may verify your identity with email codes when multi-factor authentication is enabled.
                                    Session activity can be logged for security and audit purposes.
                                </p>
                            </div>
                            <div className="border-foreground/10 flex items-start gap-3 border-t pt-5">
                                <UserCheck className="text-brand-pine mt-0.5 h-5 w-5 shrink-0" />
                                <p className="text-foreground/65 text-sm leading-relaxed">
                                    Questions about your data rights should be directed to your HR or people operations team
                                    first.
                                </p>
                            </div>
                            <div className="border-foreground/10 flex items-start gap-3 border-t pt-5">
                                <Mail className="text-brand-pine mt-0.5 h-5 w-5 shrink-0" />
                                <p className="text-foreground/65 text-sm leading-relaxed">
                                    Platform support is available through the{' '}
                                    <Link href={route('support')} className="text-brand-pine font-medium hover:underline">
                                        support page
                                    </Link>
                                    .
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </PublicSiteShell>
    );
}
