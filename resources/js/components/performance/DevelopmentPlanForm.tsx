import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DevelopmentPlanAction, Option } from '@/types/performance';
import {
    CalendarDays,
    ListChecks,
    Plus,
    Target,
    Trash2,
    UserRound,
} from 'lucide-react';

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
    canManagePlan: boolean;
    canUpdateProgress: boolean;
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
    canManagePlan,
    canUpdateProgress,
}: DevelopmentPlanFormProps) {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 xl:grid-cols-3">
                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Strengths</CardTitle>
                        <CardDescription>
                            Capture key professional strengths and demonstrated areas of excellence.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <textarea
                            className="min-h-44 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={strengths}
                            onChange={(event) => onChange('strengths', event.target.value)}
                            disabled={!canManagePlan}
                            placeholder="List key strengths, successful behaviors, and professional assets..."
                        />
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Improvement Areas</CardTitle>
                        <CardDescription>
                            Identify specific growth opportunities, gaps, or capability areas to develop.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <textarea
                            className="min-h-44 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={improvementAreas}
                            onChange={(event) => onChange('improvement_areas', event.target.value)}
                            disabled={!canManagePlan}
                            placeholder="Record improvement areas, coaching themes, or skill gaps..."
                        />
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Follow-up Notes</CardTitle>
                        <CardDescription>
                            Keep contextual notes for check-ins, future reviews, and action follow-through.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <textarea
                            className="min-h-44 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={followUpNotes}
                            onChange={(event) => onChange('follow_up_notes', event.target.value)}
                            disabled={!canManagePlan && !canUpdateProgress}
                            placeholder="Add follow-up context, meeting notes, or future review reminders..."
                        />
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm">
                <CardHeader className="border-b bg-muted/20">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle className="text-lg">Development Actions</CardTitle>
                            <CardDescription>
                                Add specific actions with owners, due dates, statuses, and follow-up notes.
                            </CardDescription>
                        </div>

                        <Button type="button" variant="outline" onClick={onAddAction} disabled={!canManagePlan}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Action
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4 p-6">
                    {actions.length === 0 ? (
                        <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed bg-muted/10 p-6">
                            <div className="space-y-2 text-center">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-muted/30">
                                    <ListChecks className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <h3 className="text-sm font-semibold text-foreground">No actions added yet</h3>
                                <p className="max-w-sm text-sm text-muted-foreground">
                                    Add the first development action to assign ownership, due dates, and progress
                                    tracking.
                                </p>
                                <Button type="button" variant="outline" onClick={onAddAction} disabled={!canManagePlan}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Action
                                </Button>
                            </div>
                        </div>
                    ) : (
                        actions.map((action, index) => (
                            <Card key={`action-${index}`} className="shadow-none">
                                <CardHeader className="border-b bg-muted/10 pb-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">Action {index + 1}</Badge>
                                            <span className="text-xs text-muted-foreground">
                                                Structured development step
                                            </span>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onRemoveAction(index)}
                                            disabled={!canManagePlan}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Remove
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-5 p-6">
                                    <div className="grid gap-4 xl:grid-cols-12">
                                        <div className="space-y-2 xl:col-span-5">
                                            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Action
                                            </label>
                                            <div className="relative">
                                                <Target className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                                <input
                                                    className="h-10 w-full rounded-md border bg-background pl-10 pr-3 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                    value={action.action}
                                                    onChange={(event) =>
                                                        onActionChange(index, 'action', event.target.value)
                                                    }
                                                    disabled={!canManagePlan}
                                                    placeholder="Describe the development action"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2 xl:col-span-3">
                                            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Owner
                                            </label>
                                            <div className="relative">
                                                <UserRound className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                                <select
                                                    className="h-10 w-full rounded-md border bg-background pl-10 pr-3 text-sm outline-none ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                    value={action.owner_user_id ?? ''}
                                                    onChange={(event) =>
                                                        onActionChange(
                                                            index,
                                                            'owner_user_id',
                                                            event.target.value ? Number(event.target.value) : null,
                                                        )
                                                    }
                                                    disabled={!canManagePlan}
                                                >
                                                    <option value="">Owner</option>
                                                    {userOptions.map((option) => {
                                                        const meta = option as Option & {
                                                            is_appraisal_owner?: boolean;
                                                            is_line_manager?: boolean;
                                                        };
                                                        const prefix = `${meta.is_appraisal_owner ? '★ ' : ''}${meta.is_line_manager ? '◆ ' : ''}`;

                                                        return (
                                                            <option key={option.value} value={option.value}>
                                                                {prefix}
                                                                {option.label}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">★ Appraisal Owner • ◆ Line Manager</p>
                                        </div>

                                        <div className="space-y-2 xl:col-span-2">
                                            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Due Date
                                            </label>
                                            <div className="relative">
                                                <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                                <input
                                                    className="h-10 w-full rounded-md border bg-background pl-10 pr-3 text-sm outline-none ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                    type="date"
                                                    value={action.due_date ?? ''}
                                                    onChange={(event) =>
                                                        onActionChange(index, 'due_date', event.target.value)
                                                    }
                                                    disabled={!canManagePlan}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2 xl:col-span-2">
                                            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Status
                                            </label>
                                            <select
                                                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                value={action.status ?? 'pending'}
                                                onChange={(event) => onActionChange(index, 'status', event.target.value)}
                                                disabled={!canManagePlan && !canUpdateProgress}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="in_progress">In progress</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Follow-up Status
                                        </label>
                                        <input
                                            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            value={action.follow_up_status ?? ''}
                                            onChange={(event) =>
                                                onActionChange(index, 'follow_up_status', event.target.value)
                                            }
                                            disabled={!canManagePlan && !canUpdateProgress}
                                            placeholder="Add progress updates, blockers, or next follow-up details"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
