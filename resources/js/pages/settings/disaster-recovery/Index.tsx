import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { CheckCircle, CloudUpload, DatabaseBackup, Download, RotateCcw, ShieldAlert, XCircle } from 'lucide-react';
import { type FormEvent, useState } from 'react';

type Backup = {
    id: number;
    trigger: string;
    status: string;
    disk: string | null;
    path: string | null;
    filename: string | null;
    size_human: string | null;
    checksum: string | null;
    error_message: string | null;
    created_by: { id: number; name: string; email: string } | null;
    created_at: string | null;
    completed_at: string | null;
    download_available: boolean;
};

type RestoreRequest = {
    id: number;
    status: string;
    notes: string | null;
    rejection_reason: string | null;
    error_message: string | null;
    backup: { id: number; filename: string | null; path: string | null; checksum: string | null; status: string } | null;
    pre_restore_backup: { id: number; filename: string | null; status: string } | null;
    requester: { id: number; name: string; email: string } | null;
    approver: { id: number; name: string; email: string } | null;
    created_at: string | null;
    approved_at: string | null;
    completed_at: string | null;
};

type RestoreTest = {
    id: number;
    status: string;
    database_verification_status: string | null;
    file_verification_status: string | null;
    error_message: string | null;
    backup: { id: number; filename: string | null; path: string | null } | null;
    started_at: string | null;
    completed_at: string | null;
};

type Props = {
    confirmationPhrase: string;
    backupDisk: string;
    backupPath: string;
    backups: Backup[];
    restoreRequests: RestoreRequest[];
    restoreTests: RestoreTest[];
    retention: {
        daily: number;
        weekly: number;
        monthly: number;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: route('settings.index') },
    { title: 'Disaster Recovery', href: route('settings.disaster_recovery.index') },
];

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (['completed', 'passed', 'approved'].includes(status)) return 'default';
    if (['failed', 'rejected'].includes(status)) return 'destructive';
    if (['running', 'pending_approval', 'queued'].includes(status)) return 'secondary';
    return 'outline';
}

function label(value: string | null | undefined) {
    return value ? value.replaceAll('_', ' ') : 'Not set';
}

export default function DisasterRecoveryIndex({ confirmationPhrase, backupDisk, backupPath, backups, restoreRequests, restoreTests, retention }: Props) {
    const [restoreBackupId, setRestoreBackupId] = useState<string>('');
    const backupForm = useForm({});
    const restoreForm = useForm<{ backup_id: string; notes: string }>({ backup_id: '', notes: '' });
    const approvalForm = useForm<{ confirmation_phrase: string }>({ confirmation_phrase: '' });

    const submitBackup = () => {
        backupForm.post(route('settings.disaster_recovery.backups.store'), { preserveScroll: true });
    };

    const submitRestore = (event: FormEvent) => {
        event.preventDefault();
        restoreForm.setData('backup_id', restoreBackupId);
        restoreForm.post(route('settings.disaster_recovery.restores.store'), { preserveScroll: true });
    };

    const approveRestore = (restore: RestoreRequest) => {
        approvalForm.post(route('settings.disaster_recovery.restores.approve', { restore: restore.id }), {
            preserveScroll: true,
            onSuccess: () => approvalForm.reset(),
        });
    };

    const rejectRestore = (restore: RestoreRequest) => {
        if (!confirm('Reject this restore request?')) return;
        router.post(route('settings.disaster_recovery.restores.reject', { restore: restore.id }), {}, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Disaster Recovery" />

            <div className="space-y-6 px-4 py-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <HeadingSmall
                        title="Disaster Recovery"
                        description="Manage HR database and file backups, guarded production restores, and isolated restoration tests."
                    />
                    <Button type="button" onClick={submitBackup} disabled={backupForm.processing}>
                        <CloudUpload className="mr-2 h-4 w-4" />
                        Run Backup
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-sm">Backup target</CardTitle>
                            <CardDescription>
                                {backupDisk} / {backupPath}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    <Card className="border shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-sm">Retention</CardTitle>
                            <CardDescription>
                                {retention.daily} daily, {retention.weekly} weekly, {retention.monthly} monthly
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    <Card className="border shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-sm">Restore approval</CardTitle>
                            <CardDescription>Two different Super Admin users are required.</CardDescription>
                        </CardHeader>
                    </Card>
                </div>

                <Card className="border shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DatabaseBackup className="h-5 w-5 text-primary" />
                            Latest backups
                        </CardTitle>
                        <CardDescription>Completed backups can be downloaded or selected for a guarded restore request.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {backups.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No disaster recovery backups have been recorded yet.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Backup</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Trigger</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Checksum</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {backups.map((backup) => (
                                        <TableRow key={backup.id}>
                                            <TableCell>
                                                <div className="font-medium">{backup.filename ?? `Backup #${backup.id}`}</div>
                                                <div className="max-w-md truncate text-xs text-muted-foreground">{backup.path ?? backup.created_at}</div>
                                                {backup.error_message ? <div className="text-xs text-red-600">{backup.error_message}</div> : null}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusVariant(backup.status)}>{label(backup.status)}</Badge>
                                            </TableCell>
                                            <TableCell>{label(backup.trigger)}</TableCell>
                                            <TableCell>{backup.size_human ?? '-'}</TableCell>
                                            <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">{backup.checksum ?? '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {backup.download_available ? (
                                                        <Button type="button" size="sm" variant="outline" asChild>
                                                            <a href={route('settings.disaster_recovery.backups.show', { backup: backup.id })}>
                                                                <Download className="h-3.5 w-3.5" />
                                                            </a>
                                                        </Button>
                                                    ) : null}
                                                    {backup.status === 'completed' ? (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setRestoreBackupId(String(backup.id));
                                                                restoreForm.setData('backup_id', String(backup.id));
                                                            }}
                                                        >
                                                            Request restore
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <Card className="border shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-primary" />
                            Request restore
                        </CardTitle>
                        <CardDescription>Restore requests must be approved by a different Super Admin before execution.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitRestore} className="grid gap-4 md:grid-cols-[260px_1fr_auto] md:items-end">
                            <div className="grid gap-2">
                                <Label htmlFor="restore-backup-id">Backup</Label>
                                <select
                                    id="restore-backup-id"
                                    value={restoreBackupId}
                                    onChange={(event) => {
                                        setRestoreBackupId(event.target.value);
                                        restoreForm.setData('backup_id', event.target.value);
                                    }}
                                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                                    required
                                >
                                    <option value="">Select completed backup</option>
                                    {backups
                                        .filter((backup) => backup.status === 'completed')
                                        .map((backup) => (
                                            <option key={backup.id} value={backup.id}>
                                                {backup.filename ?? `Backup #${backup.id}`}
                                            </option>
                                        ))}
                                </select>
                                <InputError message={restoreForm.errors.backup_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="restore-notes">Notes</Label>
                                <Input
                                    id="restore-notes"
                                    value={restoreForm.data.notes}
                                    onChange={(event) => restoreForm.setData('notes', event.target.value)}
                                    placeholder="Reason for restore"
                                />
                                <InputError message={restoreForm.errors.notes} />
                            </div>
                            <Button type="submit" disabled={restoreForm.processing || !restoreBackupId}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Request restore
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm">
                    <CardHeader>
                        <CardTitle>Restore approvals</CardTitle>
                        <CardDescription>
                            Type <code className="text-xs">{confirmationPhrase}</code> in the confirmation_phrase field to approve a pending restore.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {restoreRequests.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No restore requests have been submitted.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Request</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Pre-restore backup</TableHead>
                                        <TableHead className="text-right">Approve restore</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {restoreRequests.map((restore) => (
                                        <TableRow key={restore.id}>
                                            <TableCell>
                                                <div className="font-medium">{restore.backup?.filename ?? `Backup #${restore.backup?.id}`}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Requested by {restore.requester?.name ?? 'Unknown'} at {restore.created_at}
                                                </div>
                                                {restore.notes ? <div className="text-xs text-muted-foreground">{restore.notes}</div> : null}
                                                {restore.error_message ? <div className="text-xs text-red-600">{restore.error_message}</div> : null}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusVariant(restore.status)}>{label(restore.status)}</Badge>
                                            </TableCell>
                                            <TableCell>{restore.pre_restore_backup?.filename ?? '-'}</TableCell>
                                            <TableCell className="text-right">
                                                {restore.status === 'pending_approval' ? (
                                                    <div className="ml-auto grid max-w-sm gap-2">
                                                        <Input
                                                            name="confirmation_phrase"
                                                            value={approvalForm.data.confirmation_phrase}
                                                            onChange={(event) => approvalForm.setData('confirmation_phrase', event.target.value)}
                                                            placeholder={confirmationPhrase}
                                                        />
                                                        <InputError message={approvalForm.errors.confirmation_phrase} />
                                                        <div className="flex justify-end gap-2">
                                                            <Button type="button" size="sm" variant="outline" onClick={() => rejectRestore(restore)}>
                                                                <XCircle className="mr-2 h-3.5 w-3.5" />
                                                                Reject
                                                            </Button>
                                                            <Button type="button" size="sm" onClick={() => approveRestore(restore)} disabled={approvalForm.processing}>
                                                                <CheckCircle className="mr-2 h-3.5 w-3.5" />
                                                                Approve restore
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">No action</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <Card className="border shadow-sm">
                    <CardHeader>
                        <CardTitle>Restoration tests</CardTitle>
                        <CardDescription>Monthly isolated restore verification results for the latest completed backup.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {restoreTests.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No restoration tests have been run yet.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Backup</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Database</TableHead>
                                        <TableHead>Files</TableHead>
                                        <TableHead>Completed</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {restoreTests.map((test) => (
                                        <TableRow key={test.id}>
                                            <TableCell>
                                                <div className="font-medium">{test.backup?.filename ?? 'No backup'}</div>
                                                {test.error_message ? <div className="text-xs text-red-600">{test.error_message}</div> : null}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusVariant(test.status)}>{label(test.status)}</Badge>
                                            </TableCell>
                                            <TableCell>{label(test.database_verification_status)}</TableCell>
                                            <TableCell>{label(test.file_verification_status)}</TableCell>
                                            <TableCell>{test.completed_at ?? '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
