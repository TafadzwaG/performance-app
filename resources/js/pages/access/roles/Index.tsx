import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { BreadcrumbItem } from '@/types';
import type { Paginated, RoleRecord } from '@/types/performance';
import { Link } from '@inertiajs/react';
import { 
    Activity, 
    ClipboardCheck, 
    Database, 
    Fingerprint, 
    Key, 
    Lock, 
    Plus, 
    Settings2, 
    ShieldAlert, 
    ShieldCheck, 
    User, 
    UserCog, 
    Users 
} from 'lucide-react';

// 1. Component to map roles to specific Lucide Icons with distinct colors
const RoleIcon = ({ name, id, className }: { name: string; id: number; className?: string }) => {
    const normalized = name.toLowerCase();
    
    if (normalized.includes('super admin')) return <ShieldAlert className={`${className} text-rose-500`} />;
    if (normalized.includes('hr admin')) return <UserCog className={`${className} text-fuchsia-500`} />;
    if (normalized.includes('approving manager')) return <ClipboardCheck className={`${className} text-emerald-500`} />;
    if (normalized.includes('manager')) return <Users className={`${className} text-amber-500`} />;
    if (normalized.includes('employee')) return <User className={`${className} text-sky-500`} />;

    // Fallback deterministic library with colors
    const library = [
        { icon: Fingerprint, color: 'text-violet-500' },
        { icon: Key, color: 'text-orange-500' },
        { icon: ShieldCheck, color: 'text-blue-500' }
    ];
    
    const IconConfig = library[id % library.length];
    const Icon = IconConfig.icon;
    
    return <Icon className={`${className} ${IconConfig.color}`} />;
};

// 2. Helper to clean up permission names
const formatPermission = (name: string) => {
    const parts = name.split('.');
    const label = parts.length > 1 ? parts.slice(1).join(' ') : name;
    return label.replace(/_/g, ' ');
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Roles', href: route('access.roles.index') },
];

export default function RolesIndex({ roles }: { roles: Paginated<RoleRecord> }) {
    return (
        <PerformancePage 
            title="Roles & Access" 
            description="Manage organizational roles and granular permission sets for ToIt Solutions." 
            breadcrumbs={breadcrumbs} 
            primaryAction={{ 
                label: 'New Role', 
                href: route('access.roles.create'),
                icon: <Plus className="h-4 w-4" />,
                className: "bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all border-none"
            }}
        >
            <div className="w-full bg-slate-50 text-slate-900 font-body min-h-screen">
                <div className="p-6 w-full">
                    
                    <Card className="overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                                    <TableHead className="h-12 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">Role Identity</TableHead>
                                    <TableHead className="h-12 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">Permissions</TableHead>
                                    <TableHead className="h-12 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">Users</TableHead>
                                    <TableHead className="h-12 px-6 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roles.data.map((role) => (
                                    <TableRow key={role.id} className="group transition-colors hover:bg-blue-50/30 border-b border-slate-100 last:border-0">
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 shadow-sm border border-slate-100 group-hover:bg-white transition-colors">
                                                    <RoleIcon name={role.name} id={role.id} className="h-5 w-5 stroke-[2px]" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900">{role.name}</span>
                                                    <span className="text-[11px] text-slate-400 font-medium tracking-wide">ID: ROLE-{role.id} • {role.guard_name}</span>
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {role.permissions?.slice(0, 3).map((perm) => (
                                                    <Badge 
                                                        key={perm.id} 
                                                        variant="outline" 
                                                        className="rounded-md border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-600 group-hover:bg-white transition-colors"
                                                    >
                                                        {formatPermission(perm.name)}
                                                    </Badge>
                                                ))}
                                                {(role.permissions?.length ?? 0) > 3 && (
                                                    <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                                                        +{(role.permissions?.length ?? 0) - 3} more
                                                    </span>
                                                )}
                                                {(role.permissions?.length === 0 || !role.permissions) && (
                                                    <span className="text-[11px] italic text-slate-400">No active permissions</span>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-6 py-4">
                                            <div className="flex -space-x-2">
                                                {role.users && role.users.length > 0 ? (
                                                    role.users.slice(0, 3).map((user) => (
                                                        <div 
                                                            key={user.id} 
                                                            title={user.email}
                                                            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-100 text-[10px] font-bold uppercase text-blue-700 ring-1 ring-slate-100 shadow-sm"
                                                        >
                                                            {user.name.charAt(0)}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-[11px] italic text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">No users</span>
                                                )}
                                                {(role.users?.length ?? 0) > 3 && (
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-medium text-slate-500 ring-1 ring-slate-100 shadow-sm">
                                                        +{(role.users?.length ?? 0) - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                                    <Link href={route('access.roles.edit', role.id)}>
                                                        <Settings2 className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button asChild variant="outline" size="sm" className="h-8 text-[11px] font-bold shadow-sm transition-all text-slate-600 border-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600">
                                                    <Link href={route('access.roles.show', role.id)}>Manage Access</Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        
                        {/* Pagination Footer */}
                        <div className="flex items-center justify-between border-t border-slate-200/60 bg-slate-50 px-6 py-4">
                            <p className="text-[11px] font-medium text-slate-500">
                                Showing <span className="font-bold text-slate-900">{roles.from} - {roles.to}</span> of <span className="font-bold text-slate-900">{roles.total}</span> System Roles
                            </p>
                            <PaginationLinks paginated={roles} />
                        </div>
                    </Card>

                    {/* System Metrics Cards */}
                    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                        <Card className="flex flex-col border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-800/60">Total Roles</p>
                                <Database className="h-4 w-4 text-blue-400" />
                            </div>
                            <h3 className="mt-3 text-3xl font-bold tracking-tight text-blue-900">{roles.total}</h3>
                            <p className="mt-1 text-[11px] text-blue-600/80 font-medium">Defined in system architecture</p>
                        </Card>

                        <Card className="flex flex-col border border-slate-100 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Auth Guard</p>
                                <Lock className="h-4 w-4 text-amber-400" />
                            </div>
                            <h3 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Web</h3>
                            <p className="mt-1 text-[11px] text-slate-500 font-medium">Active provider session verified</p>
                        </Card>

                        <Card className="flex flex-col border border-slate-100 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sync Status</p>
                                <Activity className="h-4 w-4 text-emerald-500" />
                            </div>
                            <h3 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Live</h3>
                            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full animate-pulse bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: '100%' }} />
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </PerformancePage>
    );
}