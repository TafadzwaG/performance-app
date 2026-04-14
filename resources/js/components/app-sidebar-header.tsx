import { Breadcrumbs } from '@/components/breadcrumbs';
import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Link } from '@inertiajs/react';
import { Settings2 } from 'lucide-react';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    return (
        <header className="border-sidebar-border/50 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-11">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex items-center gap-1">
                <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Palette settings">
                    <Link href={route('palette.settings')} prefetch>
                        <Settings2 className="h-4 w-4" />
                        <span className="sr-only">Palette settings</span>
                    </Link>
                </Button>
                <AppearanceToggleDropdown />
            </div>
        </header>
    );
}
