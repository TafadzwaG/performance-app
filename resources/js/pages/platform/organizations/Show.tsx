import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDateTime } from '@/lib/date-utils';
import type { BreadcrumbItem } from '@/types';
import { Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Check,
    LifeBuoy,
    Loader2,
    Mail,
    MapPin,
    Pencil,
    Save,
    ShieldCheck,
    UserRound,
    Users,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';

interface OrganizationDetails {
    id: number;
    name: string;
    slug: string;
    status: 'active' | 'suspended';
    timezone: string;
    email: string | null;
    phone: string | null;
    website: string | null;
    created_at: string | null;
    updated_at: string | null;
    memberships_count: number;
    locations_count: number;
    employees_count: number;
}

interface OrganizationSettings {
    legal_name: string | null;
    registration_number: string | null;
    calibration_enabled: boolean;
    city: string | null;
    country: string | null;
}

interface LocationRecord {
    id: number;
    name: string;
    code: string;
    city: string | null;
    country: string | null;
    timezone: string | null;
    is_active: boolean;
}

interface MembershipRecord {
    id: number;
    status: string;
    is_default: boolean;
    access_all_locations: boolean;
    activated_at: string | null;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
}

interface PaginatedMemberships {
    data: MembershipRecord[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    organization: OrganizationDetails;
    settings: OrganizationSettings | null;
    locations: LocationRecord[];
    memberships: PaginatedMemberships;
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div className="space-y-1">
            <dt className="text-muted-foreground text-xs uppercase tracking-[0.14em]">{label}</dt>
            <dd className="text-sm font-medium">{value?.trim() ? value : '—'}</dd>
        </div>
    );
}

export default function PlatformOrganizationShow({ organization, settings, locations, memberships }: Props) {
    const [editOpen, setEditOpen] = useState(false);
    const editForm = useForm({
        name: organization.name,
        slug: organization.slug,
        timezone: organization.timezone,
        email: organization.email ?? '',
        phone: organization.phone ?? '',
        website: organization.website ?? '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Platform organizations', href: route('platform.organizations.index') },
        { title: organization.name, href: route('platform.organizations.show', organization.id) },
    ];

    const submitEdit = (event: FormEvent) => {
        event.preventDefault();
        editForm.patch(route('platform.organizations.update', organization.id), {
            onSuccess: () => setEditOpen(false),
        });
    };

    const enterSupport = () => {
        const reason = window.prompt(`Reason for entering ${organization.name}`);
        if (reason) router.post(route('platform.organizations.support.enter', organization.id), { reason });
    };

    return (
        <PerformancePage
            title={organization.name}
            description="Review tenant details, locations, and memberships."
            breadcrumbs={breadcrumbs}
            secondaryActions={
                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                        <Link href={route('platform.organizations.index')}>
                            <ArrowLeft className="size-4" />
                            Back
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                        <Pencil className="size-4" />
                        Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={enterSupport} disabled={organization.status !== 'active'}>
                        <LifeBuoy className="size-4" />
                        Support access
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            router.patch(route('platform.organizations.status', organization.id), {
                                status: organization.status === 'active' ? 'suspended' : 'active',
                            })
                        }
                    >
                        {organization.status === 'active' ? 'Suspend' : 'Activate'}
                    </Button>
                </div>
            }
        >
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Building2 className="size-8 text-muted-foreground" />
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        {organization.name}
                                        <Badge variant="outline">{organization.status}</Badge>
                                    </CardTitle>
                                    <CardDescription>{organization.slug}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid gap-4 sm:grid-cols-2">
                                <DetailRow label="Timezone" value={organization.timezone} />
                                <DetailRow label="Created" value={organization.created_at ? formatDateTime(organization.created_at) : null} />
                                <DetailRow label="Contact email" value={organization.email} />
                                <DetailRow label="Phone" value={organization.phone} />
                                <DetailRow label="Website" value={organization.website} />
                                <DetailRow label="Last updated" value={organization.updated_at ? formatDateTime(organization.updated_at) : null} />
                            </dl>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="size-4" />
                                Memberships
                            </CardTitle>
                            <CardDescription>Users with access to this organization.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {memberships.data.map((membership) => (
                                <div key={membership.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center">
                                    <div className="grid size-10 shrink-0 place-items-center rounded-full border bg-muted/40">
                                        <UserRound className="size-5 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-medium">{membership.user?.name ?? 'Unknown user'}</p>
                                            <Badge variant="outline" className="gap-1">
                                                <ShieldCheck className="size-3" />
                                                {membership.status}
                                            </Badge>
                                            {membership.is_default ? (
                                                <Badge variant="secondary" className="gap-1">
                                                    <Check className="size-3" />
                                                    Default
                                                </Badge>
                                            ) : null}
                                            {membership.access_all_locations ? (
                                                <Badge variant="secondary" className="gap-1">
                                                    <MapPin className="size-3" />
                                                    All locations
                                                </Badge>
                                            ) : null}
                                        </div>
                                        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                            <Mail className="size-3.5 shrink-0" />
                                            <span className="truncate">{membership.user?.email ?? 'No email'}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {memberships.data.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No memberships found for this organization.</p>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 text-sm">
                            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                                <span className="text-muted-foreground">Members</span>
                                <span className="font-semibold">{organization.memberships_count}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                                <span className="text-muted-foreground">Employees</span>
                                <span className="font-semibold">{organization.employees_count}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                                <span className="text-muted-foreground">Locations</span>
                                <span className="font-semibold">{organization.locations_count}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tenant settings</CardTitle>
                            <CardDescription>Workflow and registration details configured for this tenant.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <DetailRow label="Legal name" value={settings?.legal_name} />
                            <DetailRow label="Registration number" value={settings?.registration_number} />
                            <DetailRow
                                label="Calibration stage"
                                value={settings?.calibration_enabled === false ? 'Disabled' : 'Enabled'}
                            />
                            <DetailRow
                                label="Registered location"
                                value={[settings?.city, settings?.country].filter(Boolean).join(', ') || null}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="size-4" />
                                Locations
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {locations.map((location) => (
                                <div key={location.id} className="rounded-lg border p-4">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium">{location.name}</p>
                                        <Badge variant="outline">{location.code}</Badge>
                                        <Badge variant={location.is_active ? 'secondary' : 'outline'}>
                                            {location.is_active ? 'Active' : 'Archived'}
                                        </Badge>
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {[location.city, location.country].filter(Boolean).join(', ') || 'Address not set'}
                                        {location.timezone ? ` · ${location.timezone}` : ''}
                                    </p>
                                </div>
                            ))}

                            {locations.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No locations configured.</p>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="w-[calc(100vw-2rem)] bg-card sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit organization</DialogTitle>
                        <DialogDescription>Update details for {organization.name}.</DialogDescription>
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
                            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </PerformancePage>
    );
}
