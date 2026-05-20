import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PurgeZoneButton from '@/components/storage/purge-zone-button';
import type { StorageOverview } from '@/components/storage/storage-browser';
import { router } from '@inertiajs/react';
import { AlertTriangle, ExternalLink, FolderOpen, HardDrive, ListTodo, Mail, RotateCcw, Trash2 } from 'lucide-react';

type PendingJob = {
    id: number;
    queue: string;
    name: string;
    attempts: number;
    reserved: boolean;
    available_at: string;
    created_at: string;
};

type FailedJob = {
    id: number;
    uuid: string;
    queue: string;
    connection: string;
    name: string;
    exception: string;
    failed_at: string;
};

export type OperationsSnapshot = {
    queue: {
        connection: string;
        driver: string;
        pending_count: number;
        failed_count: number;
        pending_jobs: PendingJob[];
        failed_jobs: FailedJob[];
        worker_command: string;
        tables_ready: boolean;
    };
    storage: StorageOverview;
};

type Props = {
    operations: OperationsSnapshot;
};

export default function OperationsPanel({ operations }: Props) {
    const { queue, storage } = operations;

    const openStorage = (zone?: string) => {
        router.visit(
            route('access.storage.index', zone ? { zone, list: 'all' } : {}),
        );
    };

    return (
        <div className="space-y-6">
            <Card className="border shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ListTodo className="h-5 w-5 text-primary" />
                        Queue &amp; email jobs
                    </CardTitle>
                    <CardDescription>
                        Pending and failed jobs from the <code className="text-xs">{queue.connection}</code> connection (
                        {queue.driver}). Run <code className="text-xs">{queue.worker_command}</code> in a terminal to process them.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!queue.tables_ready ? (
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                            Queue tables are missing. Run migrations so jobs can be stored.
                        </p>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                            <Mail className="mr-1 h-3 w-3" />
                            Pending: {queue.pending_count}
                        </Badge>
                        <Badge variant={queue.failed_count > 0 ? 'destructive' : 'outline'}>
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Failed: {queue.failed_count}
                        </Badge>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-foreground">Pending jobs</h4>
                        {queue.pending_jobs.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No jobs waiting in the queue.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Job</TableHead>
                                        <TableHead>Queue</TableHead>
                                        <TableHead>Attempts</TableHead>
                                        <TableHead>Available</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {queue.pending_jobs.map((job) => (
                                        <TableRow key={job.id}>
                                            <TableCell className="font-medium">{job.name}</TableCell>
                                            <TableCell>{job.queue}</TableCell>
                                            <TableCell>
                                                {job.attempts}
                                                {job.reserved ? ' (reserved)' : ''}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{job.available_at}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        if (!confirm('Remove this pending job from the queue?')) return;
                                                        router.delete(route('settings.operations.pending_jobs.destroy', { job: job.id }));
                                                    }}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>

                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-sm font-medium text-foreground">Failed jobs</h4>
                            {queue.failed_count > 0 ? (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        if (!confirm('Clear all failed jobs?')) return;
                                        router.delete(route('settings.operations.failed_jobs.flush'));
                                    }}
                                >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                    Clear all failed
                                </Button>
                            ) : null}
                        </div>
                        {queue.failed_jobs.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No failed jobs recorded.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Job</TableHead>
                                        <TableHead>Queue</TableHead>
                                        <TableHead>Failed at</TableHead>
                                        <TableHead>Error</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {queue.failed_jobs.map((job) => (
                                        <TableRow key={job.id}>
                                            <TableCell className="font-medium">{job.name}</TableCell>
                                            <TableCell>{job.queue}</TableCell>
                                            <TableCell className="text-muted-foreground">{job.failed_at}</TableCell>
                                            <TableCell className="max-w-xs truncate text-xs text-muted-foreground" title={job.exception}>
                                                {job.exception}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            router.post(route('settings.operations.failed_jobs.retry', { job: job.id }))
                                                        }
                                                    >
                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            router.delete(route('settings.operations.failed_jobs.forget', { job: job.id }))
                                                        }
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="border shadow-sm">
                <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <HardDrive className="h-5 w-5 text-primary" />
                                Storage &amp; files
                            </CardTitle>
                            <CardDescription className="mt-1.5">
                                Disk usage across application storage zones. Open Storage Management to browse, view, download, and delete files.
                            </CardDescription>
                        </div>
                        <Button type="button" variant="outline" onClick={() => openStorage()}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open Storage Management
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg border bg-muted/10 px-4 py-3 text-sm">
                        Total managed storage: <span className="font-medium text-foreground">{storage.total_size_human}</span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {storage.zones.map((zone) => (
                            <div key={zone.key} className="rounded-lg border p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-medium text-foreground">{zone.label}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">{zone.description}</p>
                                    </div>
                                    <Badge variant="outline">{zone.size_human}</Badge>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">{zone.file_count} file(s)</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Button type="button" size="sm" variant="outline" onClick={() => openStorage(zone.key)}>
                                        <FolderOpen className="mr-2 h-3.5 w-3.5" />
                                        Browse
                                    </Button>
                                    <PurgeZoneButton zone={zone.key} label={zone.label} fileCount={zone.file_count} />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
