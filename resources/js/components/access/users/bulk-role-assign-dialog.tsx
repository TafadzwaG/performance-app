import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Option } from '@/types/performance';
import { router } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

type AssignmentMode = 'replace' | 'add' | 'remove';
type TargetScope = 'selected' | 'all';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    roleOptions: Option[];
    selectedUserIds: number[];
    totalMatchingUsers: number;
    filterParams: Record<string, string | undefined>;
    onSuccess?: () => void;
}

export default function BulkRoleAssignDialog({
    open,
    onOpenChange,
    roleOptions,
    selectedUserIds,
    totalMatchingUsers,
    filterParams,
    onSuccess,
}: Props) {
    const [roleIds, setRoleIds] = useState<number[]>([]);
    const [mode, setMode] = useState<AssignmentMode>('replace');
    const [targetScope, setTargetScope] = useState<TargetScope>('selected');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        setRoleIds([]);
        setMode('replace');
        setTargetScope(selectedUserIds.length > 0 ? 'selected' : 'all');
    }, [open, selectedUserIds.length]);

    const toggleRole = (roleId: number) => {
        setRoleIds((current) =>
            current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId],
        );
    };

    const targetCount = targetScope === 'all' ? totalMatchingUsers : selectedUserIds.length;
    const canSubmit = roleIds.length > 0 && targetCount > 0;

    const submit = () => {
        if (!canSubmit) {
            return;
        }

        setProcessing(true);

        router.post(
            route('access.users.bulk_roles'),
            {
                apply_to_filter: targetScope === 'all',
                user_ids: targetScope === 'all' ? undefined : selectedUserIds,
                role_ids: roleIds,
                mode,
                ...filterParams,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                    onSuccess?.();
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        Bulk Assign Roles
                    </DialogTitle>
                    <DialogDescription>
                        Testing utility for Super Admins. Assign roles to selected users or everyone matching the
                        current filters.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Target users
                            </Label>
                            <Select
                                value={targetScope}
                                onValueChange={(value) => setTargetScope(value as TargetScope)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="selected" disabled={selectedUserIds.length === 0}>
                                        Selected users ({selectedUserIds.length})
                                    </SelectItem>
                                    <SelectItem value="all">
                                        All matching users ({totalMatchingUsers})
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Assignment mode
                            </Label>
                            <Select value={mode} onValueChange={(value) => setMode(value as AssignmentMode)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="replace">Replace all roles</SelectItem>
                                    <SelectItem value="add">Add roles</SelectItem>
                                    <SelectItem value="remove">Remove roles</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Roles
                            </Label>
                            <Badge variant="outline">
                                {targetCount} user{targetCount === 1 ? '' : 's'}
                            </Badge>
                        </div>
                        <div className="grid max-h-64 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
                            {roleOptions.map((role) => {
                                const roleId = Number(role.value);
                                const checked = roleIds.includes(roleId);
                                const inputId = `bulk-role-${roleId}`;

                                return (
                                    <label
                                        key={roleId}
                                        htmlFor={inputId}
                                        className="flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 hover:bg-muted/30"
                                    >
                                        <span className="text-sm text-foreground">{role.label}</span>
                                        <Checkbox
                                            id={inputId}
                                            checked={checked}
                                            onCheckedChange={() => toggleRole(roleId)}
                                        />
                                    </label>
                                );
                            })}
                        </div>
                        {roleIds.length === 0 ? (
                            <p className="text-xs text-destructive">Select at least one role.</p>
                        ) : null}
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={submit} disabled={!canSubmit || processing}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Update Roles
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
