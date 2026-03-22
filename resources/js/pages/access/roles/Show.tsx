import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import type { RoleRecord } from '@/types/performance';
import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    Calendar,
    ChevronRight,
    Clock,
    Download,
    Edit,
    Globe2,
    History,
    LayoutGrid,
    Mail,
    MapPin,
    MoreVertical,
    Settings,
    Shield,
    ShieldCheck,
    UserPlus
} from 'lucide-react';

interface PermissionGroup {
    group: string;
    permissions: Array<{ id: number; name: string }>;
}

const breadcrumbs = (role: RoleRecord): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Roles', href: route('access.roles.index') },
    { title: role.name, href: route('access.roles.show', role.id) },
];

const getGroupIcon = (group: string) => {
    const name = group.toLowerCase();
    if (name.includes('system') || name.includes('config')) return <Settings className="h-5 w-5" />;
    if (name.includes('reporting') || name.includes('analytics')) return <BarChart3 className="h-5 w-5" />;
    return <LayoutGrid className="h-5 w-5" />;
};

const getGroupDescription = (group: string) => {
    const name = group.toLowerCase();
    if (name.includes('system') || name.includes('config')) return 'Global settings and environment parameters';
    if (name.includes('reporting') || name.includes('analytics')) return 'Data visualization and export capabilities';
    return 'User control and asset allocation';
};

export default function RoleShow({ role, permissionGroups }: { role: RoleRecord; permissionGroups: PermissionGroup[] }) {
    const totalPermissions = role.permissions?.length || 0;

    return (
        <PerformancePage
            title={role.name}
            description="Role summary with assigned permissions and users."
            breadcrumbs={breadcrumbs(role)}
            primaryAction={{
                label: 'Edit',
                href: route('access.roles.edit', role.id),
                icon: <Edit className="h-4 w-4" />
            }}
        >
            {/* fullPageWidthContainer */}
            <div className="w-full p-6 lg:p-10 font-body text-on-surface bg-surface min-h-screen">
                
                {/* breadcrumbsAndHeader */}
                <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div className="space-y-1">
                        <nav className="flex items-center gap-2 font-label text-xs font-semibold uppercase tracking-[0.05em] text-slate-500">
                            <span>Organization</span>
                            <ChevronRight className="h-[14px] w-[14px]" />
                            <span>Roles</span>
                            <ChevronRight className="h-[14px] w-[14px]" />
                            <span className="text-blue-600">{role.name}</span>
                        </nav>
                        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-slate-900">
                            {role.name}
                            <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-sm font-normal text-slate-500">
                                ID: ROLE-{role.id}
                            </span>
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <Button className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200 active:scale-95 shadow-none border-none">
                            <Download className="h-[18px] w-[18px]" />
                            Export
                        </Button>
                        <Link href={route('access.roles.edit', role.id)}>
                            {/* solidBlueButtonNoGradient */}
                            <Button className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 border-none">
                                <Edit className="h-[18px] w-[18px]" />
                                Edit Role
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* mainBentoGrid */}
                <div className="grid grid-cols-12 gap-6">
                    
                    {/* permissionsSection */}
                    <div className="col-span-12 space-y-6 lg:col-span-8">
                        <div className="rounded-xl bg-white p-8 shadow-sm border border-slate-100">
                            <div className="mb-8 flex items-center justify-between">
                                <h3 className="flex items-center gap-2 font-headline text-lg font-bold text-slate-900">
                                    <Shield className="h-5 w-5 text-blue-600" />
                                    Role Permissions
                                </h3>
                                <span className="font-label text-xs font-bold uppercase tracking-widest text-slate-500">
                                    {totalPermissions} Active Rules
                                </span>
                            </div>

                            <div className="space-y-10">
                                {permissionGroups.map((group) => (
                                    <div key={group.group} className="group">
                                        <div className="mb-4 flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 transition-colors group-hover:bg-blue-50">
                                                <div className="text-slate-500 transition-colors group-hover:text-blue-600">
                                                    {getGroupIcon(group.group)}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">{group.group}</h4>
                                                <p className="text-sm text-slate-500">{getGroupDescription(group.group)}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-4 pl-14 md:grid-cols-2">
                                            {group.permissions.map((permission) => {
                                                const isAssigned = (role.permissions ?? []).some((p) => p.id === permission.id);
                                                
                                                return (
                                                    <div 
                                                        key={permission.id} 
                                                        className="flex items-center justify-between rounded-lg border border-slate-200 p-3 transition-all hover:border-blue-300"
                                                    >
                                                        <span className="text-sm font-medium text-slate-700">{permission.name.replace(/_/g, ' ')}</span>
                                                        {isAssigned ? (
                                                            /* greenToggleForActiveState */
                                                            <div className="relative h-5 w-10 rounded-full bg-green-500 transition-colors">
                                                                <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm"></div>
                                                            </div>
                                                        ) : (
                                                            /* greyToggleForInactiveState */
                                                            <div className="relative h-5 w-10 rounded-full bg-slate-200 transition-colors">
                                                                <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* sidebarColumn */}
                    <div className="col-span-12 space-y-6 lg:col-span-4">
                        {/* assignedUsers */}
                        <div className="rounded-xl bg-white p-8 shadow-sm border border-slate-100">
                            <div className="mb-6 flex items-center justify-between">
                                <h3 className="font-headline text-lg font-bold text-slate-900">Assigned Users</h3>
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                    {role.users?.length ?? 0} Active
                                </span>
                            </div>
                            
                            <div className="mb-8 space-y-4">
                                {(role.users ?? []).map((user) => (
                                    <div key={user.id} className="group flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{user.name}</p>
                                                {/* addedMailIconHere */}
                                                <p className="flex items-center gap-1 text-[11px] text-slate-500">
                                                    <Mail className="h-3 w-3" />
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                        <MoreVertical className="h-5 w-5 cursor-pointer text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
                                    </div>
                                ))}
                                {(!role.users || role.users.length === 0) && (
                                    <p className="text-sm text-slate-500 italic text-center py-4">No users assigned to this role.</p>
                                )}
                            </div>
                            
                            <button className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-600 transition-all hover:border-blue-400 hover:text-blue-600">
                                <UserPlus className="h-5 w-5" />
                                Assign New User
                            </button>
                        </div>

                        {/* geographicReachWithSolidBlueInsteadOfGradient */}
                        <div className="rounded-xl bg-blue-50 border border-blue-100 p-6 shadow-sm">
                            <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-blue-900">
                                <Globe2 className="h-[18px] w-[18px]" />
                                Geographic Reach
                            </h4>
                            <p className="mb-4 text-sm text-blue-800/80">
                                This role is globally scoped across all primary datacenter regions.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {/* addedMapPinIconsHere */}
                                <span className="flex items-center gap-1 rounded bg-white px-2 py-1 text-[10px] font-bold text-blue-700 shadow-sm">
                                    <MapPin className="h-3 w-3" /> NA-EAST-1
                                </span>
                                <span className="flex items-center gap-1 rounded bg-white px-2 py-1 text-[10px] font-bold text-blue-700 shadow-sm">
                                    <MapPin className="h-3 w-3" /> EU-CENT-1
                                </span>
                                <span className="flex items-center gap-1 rounded bg-white px-2 py-1 text-[10px] font-bold text-blue-700 shadow-sm">
                                    <MapPin className="h-3 w-3" /> AP-SOUTH-2
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* bottomInformationalCards */}
                    <div className="col-span-12 grid grid-cols-1 gap-6 pt-4 md:grid-cols-3">
                        
                        <div className="rounded-xl border-l-4 border-blue-500 bg-white p-6 shadow-sm">
                            <p className="mb-2 font-label text-xs font-bold uppercase tracking-widest text-slate-500">Registration</p>
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-headline text-lg font-bold text-slate-900">Oct 12, 2023</h4>
                                    {/* addedClockIconHere */}
                                    <p className="flex items-center gap-1 text-xs text-slate-500">
                                        <Clock className="h-3 w-3" />
                                        Last updated 4d ago
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border-l-4 border-emerald-500 bg-white p-6 shadow-sm">
                            <p className="mb-2 font-label text-xs font-bold uppercase tracking-widest text-slate-500">Compliance Tier</p>
                            <div className="space-y-3">
                                <div className="flex items-end justify-between">
                                    {/* addedShieldCheckIconHere */}
                                    <h4 className="flex items-center gap-2 font-headline text-lg font-bold text-slate-900">
                                        <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                        Tier 3 (High)
                                    </h4>
                                    <span className="text-xs font-bold text-emerald-600">85% Secure</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full w-[85%] bg-emerald-500"></div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border-l-4 border-slate-300 bg-white p-6 shadow-sm">
                            <p className="mb-2 font-label text-xs font-bold uppercase tracking-widest text-slate-500">Audit History</p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                                        <History className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-headline text-lg font-bold text-slate-900">246 Logs</h4>
                                        <p className="text-xs text-slate-500">Review pending</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 cursor-pointer text-slate-400 transition-colors hover:text-blue-600" />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </PerformancePage>
    );
}