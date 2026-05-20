import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PurgeZoneButton from '@/components/storage/purge-zone-button';
import { router } from '@inertiajs/react';
import { ChevronRight, Download, ExternalLink, FolderOpen, HardDrive, RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';

export type StorageZoneSummary = {
    key: string;
    label: string;
    description: string;
    file_count: number;
    size_bytes: number;
    size_human: string;
};

export type StorageOverview = {
    default_disk: string;
    zones: StorageZoneSummary[];
    total_size_bytes: number;
    total_size_human: string;
    storage_linked: boolean;
};

export type FileEntry = {
    type: 'file' | 'directory';
    name: string;
    path: string;
    size_bytes: number | null;
    size_human: string | null;
    modified_at: string | null;
    download_url?: string;
    view_url?: string;
};

export type FilesOverview = {
    zone: string;
    path: string;
    list_all: boolean;
    breadcrumbs: { label: string; path: string | null; list_all?: boolean }[];
    zones: { key: string; label: string }[];
    entries: FileEntry[];
};

type Props = {
    storage: StorageOverview;
    files: FilesOverview;
    showSummary?: boolean;
};

function scrollToFilesPanel() {
    document.getElementById('storage-files-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function StorageBrowser({ storage, files, showSummary = true }: Props) {
    const [deleteTarget, setDeleteTarget] = useState<{ zone: string; path: string; name: string } | null>(null);

    const browseZone = (zone: string) => {
        router.get(
            route('access.storage.index'),
            { zone, list: 'all' },
            {
                preserveScroll: false,
                onSuccess: scrollToFilesPanel,
            },
        );
    };

    const openFolder = (zone: string, path: string | null = null, listAll = false) => {
        router.get(
            route('access.storage.index'),
            {
                zone,
                ...(listAll ? { list: 'all' } : path ? { path } : {}),
            },
            {
                preserveScroll: false,
                onSuccess: scrollToFilesPanel,
            },
        );
    };

    const confirmDeleteFile = () => {
        if (!deleteTarget) {
            return;
        }

        router.delete(route('access.storage.files.destroy'), {
            data: {
                zone: deleteTarget.zone,
                path: deleteTarget.path,
                ...(files.list_all ? { list: 'all' } : {}),
            },
            preserveScroll: true,
            onFinish: () => setDeleteTarget(null),
        });
    };

    const fileEntries = files.entries.filter((entry) => entry.type === 'file' || entry.name === '..');

    return (
        <div className="space-y-6">
            {showSummary ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HardDrive className="h-5 w-5 text-primary" />
                            Storage overview
                        </CardTitle>
                        <CardDescription>
                            Default disk: <strong>{storage.default_disk}</strong>.
                            {storage.storage_linked
                                ? ' Public storage symlink is active.'
                                : ' Run php artisan storage:link to serve public uploads.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-lg border bg-muted/10 px-4 py-3 text-sm">
                            Total managed storage: <span className="font-medium text-foreground">{storage.total_size_human}</span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                                        <Button type="button" size="sm" variant="outline" onClick={() => browseZone(zone.key)}>
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
            ) : null}

            <Card id="storage-files-panel">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FolderOpen className="h-5 w-5 text-primary" />
                        Files
                        {files.list_all ? (
                            <Badge variant="secondary" className="font-normal">
                                All files
                            </Badge>
                        ) : null}
                    </CardTitle>
                    <CardDescription>
                        {files.list_all
                            ? `Showing every file stored under ${files.zones.find((z) => z.key === files.zone)?.label ?? files.zone}.`
                            : 'Browse folders, or use Browse on a storage zone to list all files at once.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {files.zones.map((zone) => (
                            <Button
                                key={zone.key}
                                type="button"
                                size="sm"
                                variant={files.zone === zone.key ? 'default' : 'outline'}
                                onClick={() => browseZone(zone.key)}
                            >
                                {zone.label}
                            </Button>
                        ))}
                        <Button type="button" size="sm" variant="ghost" onClick={() => router.reload({ only: ['storage', 'files'] })}>
                            <RefreshCw className="mr-2 h-3.5 w-3.5" />
                            Refresh
                        </Button>
                    </div>

                    <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                        {files.breadcrumbs.map((crumb, index) => (
                            <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1">
                                {index > 0 ? <ChevronRight className="h-3 w-3" /> : null}
                                <button
                                    type="button"
                                    className="hover:text-foreground"
                                    onClick={() => {
                                        if (crumb.list_all) {
                                            browseZone(files.zone);
                                            return;
                                        }

                                        openFolder(files.zone, crumb.path);
                                    }}
                                >
                                    {crumb.label}
                                </button>
                            </span>
                        ))}
                    </nav>

                    {fileEntries.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No files found in this location.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{files.list_all ? 'Path' : 'Name'}</TableHead>
                                    {!files.list_all ? <TableHead>Path</TableHead> : null}
                                    <TableHead>Size</TableHead>
                                    <TableHead>Modified</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {files.entries.map((entry) => (
                                    <TableRow key={`${entry.type}-${entry.path}`}>
                                        <TableCell className="font-medium">
                                            {entry.type === 'directory' ? (
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-2 hover:text-primary"
                                                    onClick={() => openFolder(files.zone, entry.path)}
                                                >
                                                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                                                    {entry.name}
                                                </button>
                                            ) : files.list_all ? (
                                                entry.path
                                            ) : (
                                                entry.name
                                            )}
                                        </TableCell>
                                        {!files.list_all && entry.type === 'file' ? (
                                            <TableCell className="max-w-xs truncate text-muted-foreground" title={entry.path}>
                                                {entry.path}
                                            </TableCell>
                                        ) : null}
                                        {!files.list_all && entry.type === 'directory' ? <TableCell>—</TableCell> : null}
                                        <TableCell className="text-muted-foreground">{entry.size_human ?? '—'}</TableCell>
                                        <TableCell className="text-muted-foreground">{entry.modified_at ?? '—'}</TableCell>
                                        <TableCell className="text-right">
                                            {entry.type === 'file' && entry.name !== '..' ? (
                                                <div className="flex justify-end gap-1">
                                                    {entry.view_url ? (
                                                        <Button type="button" size="sm" variant="outline" asChild>
                                                            <a href={entry.view_url} target="_blank" rel="noreferrer">
                                                                <ExternalLink className="h-3.5 w-3.5" />
                                                            </a>
                                                        </Button>
                                                    ) : null}
                                                    {entry.download_url ? (
                                                        <Button type="button" size="sm" variant="outline" asChild>
                                                            <a href={entry.download_url}>
                                                                <Download className="h-3.5 w-3.5" />
                                                            </a>
                                                        </Button>
                                                    ) : null}
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setDeleteTarget({ zone: files.zone, path: entry.path, name: entry.name })}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ) : null}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete file?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Permanently delete <strong>{deleteTarget?.name}</strong>
                            {deleteTarget?.path && deleteTarget.path !== deleteTarget.name ? (
                                <>
                                    {' '}
                                    (<span className="font-mono text-xs">{deleteTarget.path}</span>)
                                </>
                            ) : null}
                            ? This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={confirmDeleteFile}
                        >
                            Delete file
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
