import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { UserRound } from 'lucide-react';

export function NavProfile() {
    const { nav } = usePage<SharedData>().props;
    const profileUrl = nav?.profileUrl;

    if (!profileUrl) {
        return null;
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Profile">
                    <Link href={profileUrl} prefetch>
                        <UserRound />
                        <span>Profile</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
