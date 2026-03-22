import { Button } from '@/components/ui/button';
import type { DevelopmentPlanAction, Option } from '@/types/performance';

interface DevelopmentPlanFormProps {
    strengths: string;
    improvementAreas: string;
    followUpNotes: string;
    actions: DevelopmentPlanAction[];
    userOptions: Option[];
    onChange: (field: 'strengths' | 'improvement_areas' | 'follow_up_notes', value: string) => void;
    onActionChange: (index: number, field: string, value: string | number | null) => void;
    onAddAction: () => void;
    onRemoveAction: (index: number) => void;
}

export default function DevelopmentPlanForm({
    strengths,
    improvementAreas,
    followUpNotes,
    actions,
    userOptions,
    onChange,
    onActionChange,
    onAddAction,
    onRemoveAction,
}: DevelopmentPlanFormProps) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
                <label className="grid gap-2 text-sm">
                    Strengths
                    <textarea className="min-h-28 rounded-md border bg-background px-3 py-2" value={strengths} onChange={(event) => onChange('strengths', event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm">
                    Improvement areas
                    <textarea
                        className="min-h-28 rounded-md border bg-background px-3 py-2"
                        value={improvementAreas}
                        onChange={(event) => onChange('improvement_areas', event.target.value)}
                    />
                </label>
                <label className="grid gap-2 text-sm">
                    Follow-up notes
                    <textarea
                        className="min-h-28 rounded-md border bg-background px-3 py-2"
                        value={followUpNotes}
                        onChange={(event) => onChange('follow_up_notes', event.target.value)}
                    />
                </label>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Actions</div>
                    <Button type="button" variant="outline" onClick={onAddAction}>
                        Add action
                    </Button>
                </div>
                {actions.map((action, index) => (
                    <div key={`action-${index}`} className="grid gap-3 rounded-lg border p-3 md:grid-cols-5">
                        <input
                            className="rounded-md border bg-background px-3 py-2 text-sm md:col-span-2"
                            value={action.action}
                            onChange={(event) => onActionChange(index, 'action', event.target.value)}
                            placeholder="Development action"
                        />
                        <select
                            className="rounded-md border bg-background px-3 py-2 text-sm"
                            value={action.owner_user_id ?? ''}
                            onChange={(event) => onActionChange(index, 'owner_user_id', event.target.value ? Number(event.target.value) : null)}
                        >
                            <option value="">Owner</option>
                            {userOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <input
                            className="rounded-md border bg-background px-3 py-2 text-sm"
                            type="date"
                            value={action.due_date ?? ''}
                            onChange={(event) => onActionChange(index, 'due_date', event.target.value)}
                        />
                        <div className="flex gap-2">
                            <select
                                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                                value={action.status ?? 'pending'}
                                onChange={(event) => onActionChange(index, 'status', event.target.value)}
                            >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In progress</option>
                                <option value="completed">Completed</option>
                            </select>
                            <Button type="button" variant="outline" onClick={() => onRemoveAction(index)}>
                                Remove
                            </Button>
                        </div>
                        <input
                            className="rounded-md border bg-background px-3 py-2 text-sm md:col-span-5"
                            value={action.follow_up_status ?? ''}
                            onChange={(event) => onActionChange(index, 'follow_up_status', event.target.value)}
                            placeholder="Follow-up status"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
