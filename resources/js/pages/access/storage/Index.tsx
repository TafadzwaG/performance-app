import PerformancePage from '@/components/performance/PerformancePage';
import StorageBrowser, { type FilesOverview, type StorageOverview } from '@/components/storage/storage-browser';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import { RefreshCw } from 'lucide-react';

interface Props {
    storage: StorageOverview;
    files: FilesOverview;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/dashboard' },
    { title: 'Storage Management', href: route('access.storage.index') },
];

export default function StorageManagementIndex({ storage, files }: Props) {
    return (
        <PerformancePage
            title="Storage Management"
            description="Browse, view, download, and delete application files across imports, exports, evidence, calibration, and branding."
            breadcrumbs={breadcrumbs}
            secondaryActions={
                <Button type="button" variant="outline" size="sm" onClick={() => router.reload({ only: ['storage', 'files'] })}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            }
        >
            <StorageBrowser storage={storage} files={files} />
        </PerformancePage>
    );
}
