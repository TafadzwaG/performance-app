import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { type User } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LogOut, Settings, UserRound } from 'lucide-react';

interface UserMenuContentProps {
    user: User;
    roles?: string[];
}

const formatRoleLabel = (role: string) =>
    role
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (character) => character.toUpperCase());

export function UserMenuContent({ user, roles = [] }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();
    const { nav } = usePage<import('@/types').SharedData>().props;
    const profileUrl = nav?.profileUrl;
    const normalizedRoles = roles
        .map((role) => role?.trim())
        .filter((role): role is string => Boolean(role && role.length > 0));

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="space-y-1.5 px-1 py-1.5 text-left text-sm">
                    <div className="flex items-center gap-2">
                        <UserInfo user={user} showEmail={true} />
                    </div>
                    {normalizedRoles.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {normalizedRoles.map((role) => (
                                <Badge
                                    key={role}
                                    variant="outline"
                                    className="border-primary/30 bg-primary/15 text-[11px] font-medium text-primary"
                                >
                                    {formatRoleLabel(role)}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                {profileUrl ? (
                    <DropdownMenuItem asChild>
                        <Link className="block w-full" href={profileUrl} as="button" prefetch onClick={cleanup}>
                            <UserRound className="mr-2" />
                            Profile
                        </Link>
                    </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem asChild>
                    <Link className="block w-full" href={route('profile.edit')} as="button" prefetch onClick={cleanup}>
                        <Settings className="mr-2" />
                        Settings
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link className="block w-full" method="post" href={route('logout')} as="button" onClick={cleanup}>
                    <LogOut className="mr-2" />
                    Log out
                </Link>
            </DropdownMenuItem>
        </>
    );
}
