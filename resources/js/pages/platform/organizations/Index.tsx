import { AsyncSearchSelect, type AsyncOption } from '@/components/async-search-select';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';
import { Link, router, useForm } from '@inertiajs/react';
import { Building2, Eye, LifeBuoy, Loader2, Pencil, Plus, Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';

interface OrganizationRecord {
    id: number;
    name: string;
    slug: string;
    status: 'active' | 'suspended';
    timezone: string;
    email: string | null;
    phone: string | null;
    website: string | null;
    memberships_count: number;
    locations_count: number;
}

interface UserOption extends AsyncOption {
    name?: string;
    email?: string;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Platform organizations', href: '/platform/organizations' }];

export default function PlatformOrganizations({ organizations }: { organizations: OrganizationRecord[] }) {
    const [selectedAdmin, setSelectedAdmin] = useState<UserOption | null>(null);
    const [editingOrganization, setEditingOrganization] = useState<OrganizationRecord | null>(null);
    const form = useForm({
        name: '',
        slug: '',
        timezone: 'Africa/Johannesburg',
        admin_user_id: '',
    });
    const editForm = useForm({
        name: '',
        slug: '',
        timezone: '',
        email: '',
        phone: '',
        website: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(route('platform.organizations.store'), {
            onSuccess: () => {
                form.reset('name', 'slug', 'admin_user_id');
                setSelectedAdmin(null);
            },
        });
    };

    const openEdit = (organization: OrganizationRecord) => {
        editForm.clearErrors();
        editForm.setData({
            name: organization.name,
            slug: organization.slug,
            timezone: organization.timezone,
            email: organization.email ?? '',
            phone: organization.phone ?? '',
            website: organization.website ?? '',
        });
        setEditingOrganization(organization);
    };

    const submitEdit = (event: FormEvent) => {
        event.preventDefault();
        if (!editingOrganization) {
            return;
        }

        editForm.patch(route('platform.organizations.update', editingOrganization.id), {
            onSuccess: () => setEditingOrganization(null),
        });
    };

    const enterSupport = (organization: OrganizationRecord) => {
        const reason = window.prompt(`Reason for entering ${organization.name}`);
        if (reason) router.post(route('platform.organizations.support.enter', organization.id), { reason });
    };

    return (
        <PerformancePage title="Platform organizations" description="Provision, suspend, and enter audited support contexts." breadcrumbs={breadcrumbs}>
            <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
                <div className="space-y-4">
                    {organizations.map((organization) => (
                        <Card key={organization.id}>
                            <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
                                <Building2 className="size-8 text-muted-foreground" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className="truncate font-semibold">
                                            <Link href={route('platform.organizations.show', organization.id)} className="hover:underline">
                                                {organization.name}
                                            </Link>
                                        </h2>
                                        <Badge variant="outline">{organization.status}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{organization.slug} · {organization.memberships_count} members · {organization.locations_count} locations</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button asChild variant="outline">
                                        <Link href={route('platform.organizations.show', organization.id)}>
                                            <Eye />
                                            View
                                        </Link>
                                    </Button>
                                    <Button variant="outline" onClick={() => openEdit(organization)}><Pencil />Edit</Button>
                                    <Button variant="outline" onClick={() => enterSupport(organization)} disabled={organization.status !== 'active'}><LifeBuoy />Support access</Button>
                                    <Button variant="outline" onClick={() => router.patch(route('platform.organizations.status', organization.id), { status: organization.status === 'active' ? 'suspended' : 'active' })}>{organization.status === 'active' ? 'Suspend' : 'Activate'}</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="size-4" />New organization</CardTitle></CardHeader>
                    <CardContent>
                        <form className="grid gap-4" onSubmit={submit}>
                            <div className="grid gap-1.5">
                                <Label htmlFor="name">Organization name</Label>
                                <Input id="name" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} required />
                                {form.errors.name ? <p className="text-xs text-destructive">{form.errors.name}</p> : null}
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="slug">Organization slug</Label>
                                <Input id="slug" value={form.data.slug} onChange={(event) => form.setData('slug', event.target.value)} required />
                                {form.errors.slug ? <p className="text-xs text-destructive">{form.errors.slug}</p> : null}
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="timezone">Timezone</Label>
                                <Input id="timezone" value={form.data.timezone} onChange={(event) => form.setData('timezone', event.target.value)} required />
                                {form.errors.timezone ? <p className="text-xs text-destructive">{form.errors.timezone}</p> : null}
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="admin_user_id">Tenant administrator</Label>
                                <AsyncSearchSelect<UserOption>
                                    id="admin_user_id"
                                    endpoint={route('platform.users.lookup')}
                                    value={form.data.admin_user_id ? Number(form.data.admin_user_id) : null}
                                    onChange={(value, option) => {
                                        form.setData('admin_user_id', value ? String(value) : '');
                                        setSelectedAdmin(option);
                                    }}
                                    placeholder="Search users by name or email…"
                                    emptyText="No users found."
                                    fallbackLabel={selectedAdmin?.label}
                                    renderOption={(option) => (
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">{option.name ?? option.label}</span>
                                            <span className="text-muted-foreground text-[11px]">{option.email}</span>
                                        </div>
                                    )}
                                />
                                <p className="text-xs text-muted-foreground">
                                    The selected user will be added as Super Admin for this organization.
                                </p>
                                {form.errors.admin_user_id ? <p className="text-xs text-destructive">{form.errors.admin_user_id}</p> : null}
                            </div>

                            <Button disabled={form.processing || !form.data.admin_user_id}>Provision organization</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={editingOrganization !== null} onOpenChange={(open) => !open && setEditingOrganization(null)}>
                <DialogContent className="w-[calc(100vw-2rem)] bg-card sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit organization</DialogTitle>
                        <DialogDescription>
                            Update details for {editingOrganization?.name}.
                        </DialogDescription>
                    </DialogHeader>

                    <form className="grid gap-4" onSubmit={submitEdit}>
                        <div className="grid gap-1.5">
                            <Label htmlFor="edit-name">Organization name</Label>
                            <Input id="edit-name" value={editForm.data.name} onChange={(event) => editForm.setData('name', event.target.value)} required />
                            {editForm.errors.name ? <p className="text-xs text-destructive">{editForm.errors.name}</p> : null}
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="edit-slug">Organization slug</Label>
                            <Input id="edit-slug" value={editForm.data.slug} onChange={(event) => editForm.setData('slug', event.target.value)} required />
                            {editForm.errors.slug ? <p className="text-xs text-destructive">{editForm.errors.slug}</p> : null}
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="edit-timezone">Timezone</Label>
                            <Input id="edit-timezone" value={editForm.data.timezone} onChange={(event) => editForm.setData('timezone', event.target.value)} required />
                            {editForm.errors.timezone ? <p className="text-xs text-destructive">{editForm.errors.timezone}</p> : null}
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="edit-email">Contact email</Label>
                            <Input id="edit-email" type="email" value={editForm.data.email} onChange={(event) => editForm.setData('email', event.target.value)} />
                            {editForm.errors.email ? <p className="text-xs text-destructive">{editForm.errors.email}</p> : null}
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="edit-phone">Phone</Label>
                            <Input id="edit-phone" value={editForm.data.phone} onChange={(event) => editForm.setData('phone', event.target.value)} />
                            {editForm.errors.phone ? <p className="text-xs text-destructive">{editForm.errors.phone}</p> : null}
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="edit-website">Website</Label>
                            <Input id="edit-website" type="url" value={editForm.data.website} onChange={(event) => editForm.setData('website', event.target.value)} placeholder="https://example.com" />
                            {editForm.errors.website ? <p className="text-xs text-destructive">{editForm.errors.website}</p> : null}
                        </div>

                        <div className="flex flex-wrap gap-2 border-t pt-4">
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                                Save changes
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setEditingOrganization(null)}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </PerformancePage>
    );
}
