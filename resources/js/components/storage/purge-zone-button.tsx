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
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

type Props = {
    zone: string;
    label: string;
    fileCount: number;
    size?: 'sm' | 'default';
};

export default function PurgeZoneButton({ zone, label, fileCount, size = 'sm' }: Props) {
    const [open, setOpen] = useState(false);

    const confirmPurge = () => {
        router.delete(route('access.storage.purge', { zone }), {
            preserveScroll: true,
            onFinish: () => setOpen(false),
        });
    };

    return (
        <>
            <Button type="button" size={size} variant="outline" disabled={fileCount === 0} onClick={() => setOpen(true)}>
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Purge
            </Button>

            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Purge {label}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete all {fileCount} file(s) in <strong>{label}</strong>. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={confirmPurge}
                        >
                            Purge files
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
