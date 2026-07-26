import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

function isItemActive(item: NavItem, url: string): boolean {
    if (item.isActive !== undefined) {
        return item.isActive;
    }

    return item.url === '/' ? url === '/' : url.startsWith(item.url);
}

export function NavPlatformAdmin({ items = [] }: { items: NavItem[] }) {
    const page = usePage();

    if (items.length === 0) {
        return null;
    }

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform administration</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const active = isItemActive(item, page.url);

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                                <Link href={item.url} prefetch>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
