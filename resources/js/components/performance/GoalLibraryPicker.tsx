import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { GoalLibraryItem } from '@/types/performance';

interface GoalLibraryPickerProps {
    items: GoalLibraryItem[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPick: (item: GoalLibraryItem) => void;
}

export default function GoalLibraryPicker({ items, open, onOpenChange, onPick }: GoalLibraryPickerProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Goal Library</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    {items.map((item) => (
                        <div key={item.id} className="rounded-lg border p-4">
                            <div className="font-medium">{item.title}</div>
                            <div className="mt-1 text-sm text-muted-foreground">{item.description}</div>
                            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                <span>{item.perspective?.name}</span>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => {
                                        onPick(item);
                                        onOpenChange(false);
                                    }}
                                >
                                    Use goal
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
