import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { AccessUserRecord } from '@/types/performance';
import { Link } from '@inertiajs/react';

interface PermissionRecord {
    id: number;
    name: string;
}

const breadcrumbs = (userRecord: AccessUserRecord): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Users', href: route('access.users.index') },
    { title: userRecord.name, href: route('access.users.show', userRecord.id) },
];

export default function UserShow({ userRecord, effectivePermissions }: { userRecord: AccessUserRecord; effectivePermissions: PermissionRecord[] }) {
    return (
        <PerformancePage
            title={userRecord.name}
            description="User account details, assigned roles, and resolved permissions."
            breadcrumbs={breadcrumbs(userRecord)}
            secondaryActions={
                <Button asChild variant="outline">
                    <Link href={route('access.users.edit', userRecord.id)}>Edit</Link>
                </Button>
            }
        >
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Account</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div>Name: {userRecord.name}</div>
                        <div>Email: {userRecord.email}</div>
                        <div>Email verified: {userRecord.email_verified_at ? 'Yes' : 'No'}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Employee Link</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div>Employee number: {userRecord.employee_profile?.employee_number ?? 'Not linked'}</div>
                        <div>Department: {userRecord.employee_profile?.department?.name ?? 'Not linked'}</div>
                        <div>Job title: {userRecord.employee_profile?.job_title?.name ?? 'Not linked'}</div>
                        {userRecord.employee_profile ? (
                            <Button asChild variant="outline" size="sm">
                                <Link href={route('performance.employees.show', userRecord.employee_profile.id)}>Open Employee Profile</Link>
                            </Button>
                        ) : null}
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Assigned Roles</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {(userRecord.roles ?? []).length > 0 ? (
                            userRecord.roles?.map((role) => (
                                <Badge key={role.id} variant="outline">
                                    {role.name}
                                </Badge>
                            ))
                        ) : (
                            <span className="text-sm text-muted-foreground">No roles assigned.</span>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Direct Permissions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {(userRecord.permissions ?? []).length > 0 ? (
                            userRecord.permissions?.map((permission) => (
                                <Badge key={permission.id} variant="outline">
                                    {permission.name}
                                </Badge>
                            ))
                        ) : (
                            <span className="text-sm text-muted-foreground">No direct permissions assigned.</span>
                        )}
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Effective Permissions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {effectivePermissions.length > 0 ? (
                        effectivePermissions.map((permission) => (
                            <Badge key={permission.id} variant="secondary">
                                {permission.name}
                            </Badge>
                        ))
                    ) : (
                        <span className="text-sm text-muted-foreground">No effective permissions resolved.</span>
                    )}
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
