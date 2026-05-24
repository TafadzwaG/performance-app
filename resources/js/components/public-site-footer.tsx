import { MonLogo } from '@/components/mon-logo';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { FileText, LifeBuoy, Scale, ShieldCheck } from 'lucide-react';

const footerLinks = [
    { href: () => route('privacy-policy'), label: 'Privacy Policy', icon: ShieldCheck },
    { href: () => route('privacy-notice'), label: 'Privacy Notice', icon: FileText },
    { href: () => route('support'), label: 'Support', icon: LifeBuoy },
    { href: () => route('terms'), label: 'Terms of Service', icon: Scale },
] as const;

export default function PublicSiteFooter() {
    const { branding } = usePage<SharedData>().props;
    const companyName = branding?.companyName ?? 'Performance Appraisal Studio';
    const year = new Date().getFullYear();

    return (
        <footer className="border-foreground/15 relative z-10 border-t bg-background/80 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-12">
                <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
                    <div className="space-y-4 lg:col-span-4">
                        <Link href={route('home')} className="group inline-flex items-center">
                            <MonLogo className="h-11 w-auto max-w-[220px] transition-opacity group-hover:opacity-90" withBackdrop />
                        </Link>
                        <p className="text-foreground/65 max-w-sm text-sm leading-relaxed">
                            {companyName} helps teams plan goals, run fair reviews, and keep appraisal records clear and
                            auditable.
                        </p>
                    </div>

                    <div className="lg:col-span-5">
                        <div className="font-mono-brand text-foreground/55 mb-4 text-[10px] tracking-[0.22em] uppercase">
                            Legal & support
                        </div>
                        <nav aria-label="Footer" className="grid gap-2 sm:grid-cols-2">
                            {footerLinks.map(({ href, label, icon: Icon }) => (
                                <Link
                                    key={label}
                                    href={href()}
                                    className="text-foreground/75 hover:text-brand-pine dark:hover:text-brand-sand group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm transition-colors hover:border-foreground/10 hover:bg-foreground/5"
                                >
                                    <span className="bg-brand-sand/20 text-brand-pine dark:text-brand-sand flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    <span className="font-medium">{label}</span>
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="flex flex-col justify-between gap-4 lg:col-span-3">
                        <div>
                            <div className="font-mono-brand text-foreground/55 text-[10px] tracking-[0.22em] uppercase">
                                Contact
                            </div>
                            <p className="text-foreground/65 mt-3 text-sm leading-relaxed">
                                Need help with access, appraisals, or data requests? Start on the{' '}
                                <Link href={route('support')} className="text-brand-pine dark:text-brand-sand font-medium hover:underline">
                                    support page
                                </Link>
                                .
                            </p>
                        </div>
                        <p className="font-mono-brand text-foreground/50 text-[10px] tracking-[0.18em] uppercase">
                            © {year} {companyName}
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
