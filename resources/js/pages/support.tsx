import PublicSiteShell from '@/components/public-site-shell';
import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, BookOpen, KeyRound, LifeBuoy, Mail, MessageCircleQuestion, ShieldAlert } from 'lucide-react';

const supportTopics = [
    {
        title: 'Account access',
        icon: KeyRound,
        copy: 'Forgotten passwords, pending approval, employee number sign-in, and profile completion issues.',
    },
    {
        title: 'Appraisal workflow',
        icon: MessageCircleQuestion,
        copy: 'Goal planning, self assessment, manager review, approvals, and send-back questions.',
    },
    {
        title: 'Security concerns',
        icon: ShieldAlert,
        copy: 'Report suspicious sign-in activity, permission problems, or suspected misuse of employee records.',
    },
];

export default function Support() {
    const { auth } = usePage<SharedData>().props;

    return (
        <PublicSiteShell title="Support">
            <section className="relative overflow-hidden">
                <div className="bg-hero-photo pointer-events-none absolute inset-0 opacity-80" aria-hidden />
                <div className="relative mx-auto max-w-7xl px-6 pt-10 pb-16 lg:px-10 lg:pt-16 lg:pb-24">
                    <div className="font-mono-brand text-brand-pine mb-6 flex items-center gap-3 text-[11px] tracking-[0.22em] uppercase">
                        <span className="bg-brand-pine inline-block h-px w-8" />
                        <span>Support</span>
                    </div>

                    <h1 className="font-display text-balance max-w-3xl text-[clamp(2.5rem,6vw,5rem)] leading-[0.94] font-light tracking-tight">
                        Help when the <span className="text-brand-pine italic">cycle stalls</span>.
                    </h1>

                    <p className="text-foreground/75 mt-6 max-w-2xl text-base leading-relaxed lg:text-lg">
                        Start here for access, appraisal workflow, and security questions. Your HR administrator remains the
                        first point of contact for employment-specific decisions.
                    </p>

                    <div className="mt-10 flex flex-wrap gap-3">
                        {auth.user ? (
                            <Button asChild>
                                <Link href={route('access.help.index')}>
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Open help & docs
                                </Link>
                            </Button>
                        ) : null}
                        <Button asChild variant={auth.user ? 'outline' : 'default'}>
                            <Link href={auth.user ? route('dashboard') : route('login')}>
                                {auth.user ? 'Go to dashboard' : 'Sign in for help'}
                                <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
                <div className="grid gap-6 lg:grid-cols-12">
                    <div className="space-y-4 lg:col-span-7">
                        {supportTopics.map((topic) => (
                            <article key={topic.title} className="border-foreground/15 bg-card flex gap-4 rounded-xl border p-6">
                                <div className="bg-brand-sand/15 text-brand-pine flex h-11 w-11 shrink-0 items-center justify-center rounded-md">
                                    <topic.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-display text-xl">{topic.title}</h2>
                                    <p className="text-foreground/65 mt-2 text-sm leading-relaxed">{topic.copy}</p>
                                </div>
                            </article>
                        ))}
                    </div>

                    <aside className="lg:col-span-5">
                        <div className="border-foreground/15 bg-brand-ink text-brand-cream space-y-5 rounded-xl border p-6 lg:p-8">
                            <div className="bg-brand-sand/15 text-brand-sand flex h-12 w-12 items-center justify-center rounded-md">
                                <LifeBuoy className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="font-display text-3xl">Need a person?</h2>
                                <p className="text-brand-cream/75 mt-3 text-sm leading-relaxed">
                                    Contact your HR administrator or system owner for account approval, role changes, and
                                    organisation-specific policy questions.
                                </p>
                            </div>
                            <div className="border-brand-cream/15 flex items-start gap-3 border-t pt-5">
                                <Mail className="text-brand-sand mt-0.5 h-5 w-5 shrink-0" />
                                <div className="text-sm leading-relaxed">
                                    <p className="text-brand-cream/75">
                                        For technical issues with the studio, email your internal IT or HR operations contact.
                                    </p>
                                    <p className="text-brand-cream/55 mt-3 text-xs uppercase tracking-wide">
                                        Include your name, employee number, and a screenshot if possible.
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3 pt-2">
                                <Button asChild variant="secondary" className="bg-brand-sand text-brand-ink hover:bg-brand-sand/90">
                                    <Link href={route('privacy-notice')}>Privacy notice</Link>
                                </Button>
                                <Button asChild variant="outline" className="border-brand-cream/25 text-brand-cream hover:bg-brand-cream/10">
                                    <Link href={route('terms')}>Terms of service</Link>
                                </Button>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </PublicSiteShell>
    );
}
