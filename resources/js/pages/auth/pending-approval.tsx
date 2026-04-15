import { Head, Link } from '@inertiajs/react';
import { Clock3, FileCheck2, Goal, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AuthLayout from '@/layouts/auth-layout';

interface PendingApprovalProps {
    status?: string | null;
    error?: string | null;
}

const overviewItems = [
    {
        title: 'Goal Planning',
        description: 'Set SMART goals with measurable KPIs and expected outcomes.',
        icon: Goal,
    },
    {
        title: 'Structured Reviews',
        description: 'Run self, manager, and approval stages through one workflow.',
        icon: Clock3,
    },
    {
        title: 'Scoring & Ratings',
        description: 'Track weighted objective scores and final performance ratings.',
        icon: FileCheck2,
    },
    {
        title: 'Secure Access',
        description: 'Use role and permission based access for each performance action.',
        icon: ShieldCheck,
    },
];

export default function PendingApproval({ status, error }: PendingApprovalProps) {
    return (
        <AuthLayout
            title="Account Pending Approval"
            description="Your registration is complete. An administrator must approve your account before you can access the dashboard."
        >
            <Head title="Pending Approval" />

            <div className="space-y-4">
                {(status || error) && (
                    <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground">
                        {error ?? status}
                    </div>
                )}

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">System Overview</CardTitle>
                        <CardDescription>
                            Once approved, you can plan goals, submit assessments, and track performance end-to-end.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {overviewItems.map((item) => (
                            <div key={item.title} className="flex items-start gap-3 rounded-md border border-border bg-background p-3">
                                <item.icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                                    <p className="text-xs text-muted-foreground">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Button asChild className="w-full">
                    <Link href={route('login')}>Back to sign in</Link>
                </Button>
            </div>
        </AuthLayout>
    );
}
