import PublicSiteFooter from '@/components/public-site-footer';
import PublicSiteHeader from '@/components/public-site-header';
import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';

type PublicSiteShellProps = {
    title: string;
    children: ReactNode;
    backHref?: string;
    backLabel?: string;
};

export default function PublicSiteShell({ title, children, backHref, backLabel }: PublicSiteShellProps) {
    return (
        <>
            <Head title={title}>
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=fraunces:300,400,500,600,700|instrument-sans:400,500,600|jetbrains-mono:400,500"
                    rel="stylesheet"
                />
            </Head>

            <div className="bg-paper text-foreground relative min-h-screen overflow-x-hidden">
                <div className="bg-grain pointer-events-none fixed inset-0 z-0 opacity-20 mix-blend-multiply" />
                <div className="bg-topo pointer-events-none fixed inset-0 z-0 opacity-40" />

                <PublicSiteHeader backHref={backHref} backLabel={backLabel} />
                <main className="relative z-10">{children}</main>
                <PublicSiteFooter />
            </div>
        </>
    );
}
