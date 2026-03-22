import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import type { Option, RoleRecord } from '@/types/performance';
import { Link, useForm } from '@inertiajs/react';
import {
    BarChart3,
    CheckCircle2,
    Circle,
    LayoutGrid,
    Lightbulb,
    Search,
    Settings,
    UserPlus
} from 'lucide-react';
import { type FormEvent, useState } from 'react';

interface PermissionGroup {
    group: string;
    permissions: Array<{ id: number; name: string }>;
}

// Extending your Option type locally to include email
interface UserOption extends Option {
    email?: string;
}

export default function RoleEdit({ role, permissionGroups, userOptions }: { role: RoleRecord; permissionGroups: PermissionGroup[]; userOptions: UserOption[] }) {
    return <RoleEditForm role={role} permissionGroups={permissionGroups} userOptions={userOptions} />;
}

const getGroupIcon = (group: string) => {
    const name = group.toLowerCase();
    if (name.includes('system') || name.includes('config')) return <Settings className="h-5 w-5" />;
    if (name.includes('reporting') || name.includes('analytics')) return <BarChart3 className="h-5 w-5" />;
    return <LayoutGrid className="h-5 w-5" />;
};

function RoleEditForm({ role, permissionGroups, userOptions }: { role: RoleRecord; permissionGroups: PermissionGroup[]; userOptions: UserOption[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Performance', href: '/performance/dashboard' },
        { title: 'Roles', href: route('access.roles.index') },
        { title: role.name, href: route('access.roles.show', role.id) },
        { title: 'Edit', href: route('access.roles.edit', role.id) },
    ];

    const { data, setData, put, processing } = useForm<{ name: string; permission_ids: number[]; user_ids: number[] }>({
        name: role.name,
        permission_ids: role.permissions?.map((permission) => permission.id) ?? [],
        user_ids: role.users?.map((user) => user.id) ?? [],
    });

    const [userSearchTerm, setUserSearchTerm] = useState('');

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(route('access.roles.update', role.id));
    };

    const togglePermission = (id: number) => {
        setData(
            'permission_ids',
            data.permission_ids.includes(id)
                ? data.permission_ids.filter((p) => p !== id)
                : [...data.permission_ids, id]
        );
    };

    const toggleUser = (id: number) => {
        setData(
            'user_ids',
            data.user_ids.includes(id)
                ? data.user_ids.filter((u) => u !== id)
                : [...data.user_ids, id]
        );
    };

    const filteredUsers = userOptions.filter((option) =>
        option.label.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        (option.email && option.email.toLowerCase().includes(userSearchTerm.toLowerCase()))
    );

    return (
        <PerformancePage title="Edit Role" description="Update role membership and permission assignment." breadcrumbs={breadcrumbs}>
            <form onSubmit={submit} className="w-full bg-slate-50 text-slate-900 font-body min-h-screen relative pb-32">
                
                {/* Main Content Area */}
                <div className="p-6 lg:p-10 w-full">
                    
                    <div className="grid grid-cols-12 gap-8 items-start">
                        
                        {/* Form Section (Left Column) */}
                        <div className="col-span-12 lg:col-span-8 space-y-8">
                            
                            {/* Role Identity Card */}
                            <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200/60">
                                <div className="mb-2">
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] mb-2">Role Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full border-0 border-b-2 border-slate-200 focus:border-blue-600 focus:ring-0 outline-none py-3 text-lg font-semibold text-slate-900 transition-colors bg-transparent px-0"
                                        value={data.name} 
                                        onChange={(event) => setData('name', event.target.value)} 
                                        required
                                    />
                                </div>
                            </section>

                            {/* Permissions Matrix Section */}
                            <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200/60">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                    <div>
                                        <h3 className="text-lg font-bold font-headline">Permissions Matrix</h3>
                                        <p className="text-xs text-slate-500 mt-1">Configure feature-level access for this role.</p>
                                    </div>
                                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-3 py-1.5 rounded-md tracking-wider">
                                        GLOBAL OVERRIDE ENABLED
                                    </span>
                                </div>

                                <div className="space-y-10">
                                    {permissionGroups.map((group) => (
                                        <div key={group.group} className="space-y-4">
                                            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                <span className="text-slate-400">{getGroupIcon(group.group)}</span>
                                                {group.group}
                                            </h4>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3 pl-1">
                                                {group.permissions.map((permission) => {
                                                    const isChecked = data.permission_ids.includes(permission.id);
                                                    
                                                    return (
                                                        <div 
                                                            key={permission.id}
                                                            onClick={() => togglePermission(permission.id)}
                                                            className="flex items-center justify-between cursor-pointer group py-1"
                                                        >
                                                            <span className={`text-sm font-medium transition-colors ${isChecked ? 'text-slate-900 font-semibold' : 'text-slate-600 group-hover:text-blue-600'}`}>
                                                                {permission.name.replace(/_/g, ' ')}
                                                            </span>
                                                            
                                                            {/* Custom Toggle */}
                                                            <div className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${isChecked ? 'bg-green-500' : 'bg-slate-200'}`}>
                                                                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isChecked ? 'translate-x-5' : 'translate-x-0'}`} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Side Assignment Section (Right Column) */}
                        <div className="col-span-12 lg:col-span-4 space-y-6">
                            
                            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/60 flex flex-col max-h-[600px]">
                                <h3 className="text-md font-bold font-headline mb-4 flex items-center gap-2 text-slate-900">
                                    <UserPlus className="h-5 w-5 text-blue-600" />
                                    Assign Users
                                </h3>
                                
                                <div className="relative mb-6">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                                    <input 
                                        type="text" 
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-600/20" 
                                        placeholder="Filter by name or email..."
                                        value={userSearchTerm}
                                        onChange={(e) => setUserSearchTerm(e.target.value)}
                                    />
                                </div>
                                
                                <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                                    {filteredUsers.map((option) => {
                                        const userId = Number(option.value);
                                        const isAssigned = data.user_ids.includes(userId);
                                        
                                        return (
                                            <div 
                                                key={userId}
                                                onClick={() => toggleUser(userId)}
                                                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${isAssigned ? 'bg-blue-50/50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                                        <span className="text-xs font-bold text-slate-600">
                                                            {option.label.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col truncate">
                                                        <p className="text-sm font-semibold text-slate-900 leading-tight truncate">{option.label}</p>
                                                        {/* Email shown here instead of ID */}
                                                        <p className="text-[10px] text-slate-500 truncate">
                                                            {option.email || 'No email provided'}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {isAssigned ? (
                                                    <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
                                                ) : (
                                                    <Circle className="h-5 w-5 text-slate-300 shrink-0" />
                                                )}
                                            </div>
                                        );
                                    })}

                                    {filteredUsers.length === 0 && (
                                        <div className="text-center py-8 text-sm text-slate-500 italic">
                                            No users found matching "{userSearchTerm}"
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Help Context Card */}
                            <section className="bg-slate-900 p-6 rounded-xl shadow-lg text-white">
                                <Lightbulb className="h-6 w-6 text-blue-400 mb-3" />
                                <h4 className="font-bold text-sm mb-2">Architectural Guardrails</h4>
                                <p className="text-xs text-slate-300 leading-relaxed opacity-90">
                                    System Architects have full deployment rights. Ensure mandatory 2FA is enabled for all assigned users to maintain compliance standard ISO-27001.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>

                {/* Sticky Footer Actions */}
                <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200/80 p-6 flex justify-end gap-4 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] z-40">
                    <Link href={route('access.roles.show', role.id)}>
                        <Button type="button" variant="ghost" className="px-8 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                            Cancel
                        </Button>
                    </Link>
                    <Button 
                        type="submit" 
                        disabled={processing}
                        className="px-10 py-2.5 rounded-lg text-sm font-bold bg-blue-600 text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all border-none"
                    >
                        {processing ? 'Saving...' : 'Update Role'}
                    </Button>
                </div>
                
            </form>
        </PerformancePage>
    );
}