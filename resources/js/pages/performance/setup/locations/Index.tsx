import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { MapPin, Plus, Users } from 'lucide-react';
import type { FormEvent } from 'react';

interface LocationRecord {
    id: number;
    name: string;
    code: string;
    city: string | null;
    country: string | null;
    timezone: string | null;
    is_active: boolean;
    employee_profiles_count: number;
    users_count: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Locations', href: '/performance/setup/locations' },
];

export default function LocationsIndex({ locations, can }: { locations: LocationRecord[]; can: { create: boolean; update: boolean; archive: boolean } }) {
    const form = useForm({ name: '', code: '', timezone: '', city: '', country: '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(route('performance.setup.locations.store'), { onSuccess: () => form.reset() });
    };

    return (
        <PerformancePage title="Locations" description="Manage the organization locations used for employee access and reporting scope." breadcrumbs={breadcrumbs}>
            <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
                <div className="grid gap-4 md:grid-cols-2">
                    {locations.map((location) => (
                        <Card key={location.id}>
                            <CardContent className="space-y-4 p-5">
                                <div className="flex items-start gap-3">
                                    <MapPin className="mt-1 size-5 text-muted-foreground" />
                                    <div className="flex-1"><div className="flex items-center gap-2"><h2 className="font-semibold">{location.name}</h2><Badge variant="outline">{location.code}</Badge></div><p className="text-sm text-muted-foreground">{[location.city, location.country].filter(Boolean).join(', ') || 'Address not set'}</p></div>
                                </div>
                                <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-muted-foreground"><Users className="size-4" />{location.employee_profiles_count} employees</span><Badge variant={location.is_active ? 'secondary' : 'outline'}>{location.is_active ? 'Active' : 'Archived'}</Badge></div>
                                {can.archive && location.is_active ? <Button variant="outline" size="sm" disabled={location.employee_profiles_count > 0} onClick={() => router.delete(route('performance.setup.locations.destroy', location.id))}>Archive</Button> : null}
                            </CardContent>
                        </Card>
                    ))}
                </div>
                {can.create ? (
                    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="size-4" />Add location</CardTitle></CardHeader><CardContent><form className="grid gap-4" onSubmit={submit}>{(['name', 'code', 'timezone', 'city', 'country'] as const).map((field) => <div className="grid gap-1.5" key={field}><Label htmlFor={field}>{field}</Label><Input id={field} value={form.data[field]} onChange={(event) => form.setData(field, event.target.value)} required={field === 'name' || field === 'code'} />{form.errors[field] ? <p className="text-xs text-destructive">{form.errors[field]}</p> : null}</div>)}<Button disabled={form.processing}>Create location</Button></form></CardContent></Card>
                ) : null}
            </div>
        </PerformancePage>
    );
}
