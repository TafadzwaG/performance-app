import { Breadcrumbs } from '@/components/breadcrumbs';
import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { OrganizationSwitcher } from '@/components/organization-switcher';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Settings2 } from 'lucide-react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { auth } = usePage<SharedData>().props;
    const permissions = auth.permissions ?? [];
    const roles = auth.roles ?? [];
    const canManageSystemSettings =
        Boolean(auth.user?.is_platform_admin) ||
        roles.some((role) => role.toLowerCase() === 'super admin') ||
        permissions.includes('system.settings.manage');

    return (
        <header className="border-sidebar-border/50 flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-11">
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex shrink-0 items-center gap-2">
                <OrganizationSwitcher />
                {canManageSystemSettings ? (
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Settings">
                        <Link href={route('settings.index')} prefetch>
                            <Settings2 className="h-4 w-4" />
                            <span className="sr-only">Settings</span>
                        </Link>
                    </Button>
                ) : null}
                <AppearanceToggleDropdown />
            </div>
        </header>
    );
}
