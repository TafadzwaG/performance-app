import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target } from 'lucide-react';
import type { GoalLibraryItem, Objective, Option, RatingScaleLevel } from '@/types/performance';
import EvidenceUploader from './EvidenceUploader';

interface ObjectiveFormRowProps {
    appraisalId?: number;
    objective: Objective;
    index: number;
    mode: 'plan' | 'self' | 'manager' | 'show';
    perspectiveOptions: Option[];
    ratingLevels?: RatingScaleLevel[];
    goalLibraryItems?: GoalLibraryItem[];
    onChange?: (index: number, field: string, value: string | number | boolean | null) => void;
    onRemove?: (index: number) => void;
}

export default function ObjectiveFormRow({
    appraisalId,
    objective,
    index,
    mode,
    perspectiveOptions,
    ratingLevels = [],
    goalLibraryItems = [],
    onChange,
    onRemove,
}: ObjectiveFormRowProps) {
    const isReadOnly = mode === 'show';
    const currentRatingLevelId =
        mode === 'self'
            ? objective.self_rating_scale_level_id
            : mode === 'manager'
              ? objective.manager_rating_scale_level_id
              : objective.manager_rating_scale_level_id ?? objective.self_rating_scale_level_id;
    const currentRatingLabel = ratingLevels.find((level) => level.id === currentRatingLevelId)?.label ?? 'Not rated';
    const currentPerspectiveLabel =
        perspectiveOptions.find((option) => Number(option.value) === Number(objective.perspective_id))?.label ?? '-';
    const weightValue = Number(objective.weight ?? 0);
    const clampedWeightValue = Number.isFinite(weightValue) ? Math.max(0, Math.min(100, weightValue)) : 0;
    const donutRadius = 16;
    const donutCircumference = 2 * Math.PI * donutRadius;
    const donutOffset = donutCircumference - (clampedWeightValue / 100) * donutCircumference;

    return (
        <tr className="align-top">
            <td className="p-2">
                {mode === 'plan' ? (
                    <Select
                        value={String(objective.perspective_id ?? '')}
                        onValueChange={(value) => onChange?.(index, 'perspective_id', Number(value))}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select perspective" />
                        </SelectTrigger>
                        <SelectContent>
                            {perspectiveOptions.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                        {currentPerspectiveLabel}
                    </div>
                )}
            </td>
            <td className="p-2">
                {mode === 'plan' && goalLibraryItems.length > 0 ? (
                    <Select
                        value={objective.goal_library_item_id ? String(objective.goal_library_item_id) : '__none__'}
                        onValueChange={(value) =>
                            onChange?.(index, 'goal_library_item_id', value === '__none__' ? null : Number(value))
                        }
                    >
                        <SelectTrigger className="mb-2 w-full">
                            <SelectValue placeholder="Goal library option" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__none__">Goal library option</SelectItem>
                            {goalLibraryItems.map((item) => (
                                <SelectItem key={item.id} value={String(item.id)}>
                                    {item.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : null}
                <Input
                    value={objective.title}
                    onChange={(event) => onChange?.(index, 'title', event.target.value)}
                    readOnly={mode !== 'plan'}
                />
            </td>
            <td className="p-2">
                <textarea
                    className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={
                        mode === 'self'
                            ? objective.performance_achieved ?? ''
                            : mode === 'manager'
                              ? objective.manager_comment ?? ''
                              : objective.kpi_measure ?? ''
                    }
                    onChange={(event) =>
                        onChange?.(
                            index,
                            mode === 'self' ? 'performance_achieved' : mode === 'manager' ? 'manager_comment' : 'kpi_measure',
                            event.target.value,
                        )
                    }
                    readOnly={isReadOnly}
                />
            </td>
            <td className="p-2">
                <textarea
                    className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={objective.target_definition ?? ''}
                    onChange={(event) => onChange?.(index, 'target_definition', event.target.value)}
                    readOnly={mode !== 'plan'}
                />
            </td>
            <td className="p-2">
                {mode === 'show' ? (
                    <div className="flex items-center gap-2">
                        <div className="relative h-10 w-10" aria-label={`Objective weight ${clampedWeightValue}%`}>
                            <svg viewBox="0 0 40 40" className="h-10 w-10 -rotate-90">
                                <circle cx="20" cy="20" r={donutRadius} className="stroke-muted" strokeWidth="5" fill="none" />
                                <circle
                                    cx="20"
                                    cy="20"
                                    r={donutRadius}
                                    className="stroke-primary"
                                    strokeWidth="5"
                                    fill="none"
                                    strokeDasharray={donutCircumference}
                                    strokeDashoffset={donutOffset}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-foreground">
                                {clampedWeightValue}%
                            </div>
                        </div>
                        <span className="text-xs text-muted-foreground">Weight</span>
                    </div>
                ) : (
                    <Input
                        className="w-24"
                        type="number"
                        value={objective.weight}
                        onChange={(event) => onChange?.(index, 'weight', Number(event.target.value))}
                        readOnly={mode !== 'plan'}
                    />
                )}
            </td>
            <td className="p-2">
                {mode === 'plan' ? (
                    <Input
                        className="w-40"
                        value={objective.evidence_source ?? ''}
                        onChange={(event) => onChange?.(index, 'evidence_source', event.target.value)}
                    />
                ) : mode === 'show' ? (
                    <Badge variant="outline">{currentRatingLabel}</Badge>
                ) : (
                    <Select
                        value={currentRatingLevelId ? String(currentRatingLevelId) : '__none__'}
                        onValueChange={(value) =>
                            onChange?.(
                                index,
                                mode === 'self' ? 'self_rating_scale_level_id' : 'manager_rating_scale_level_id',
                                value === '__none__' ? null : Number(value),
                            )
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__none__">Select</SelectItem>
                            {ratingLevels.map((level) => (
                                <SelectItem key={level.id} value={String(level.id)}>
                                    {level.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </td>
            <td className="p-2">
                {appraisalId && mode !== 'plan' ? (
                    <div className="space-y-2">
                        {objective.evidences?.length ? (
                            objective.evidences.map((evidence) => (
                                <div key={evidence.id} className="rounded-md border bg-muted/20 px-2 py-1.5 text-xs text-muted-foreground">
                                    {evidence.original_name ?? evidence.url ?? evidence.path}
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center gap-1.5 rounded-md border border-dashed bg-muted/20 px-2 py-1.5 text-xs text-muted-foreground">
                                <Target className="h-3.5 w-3.5" />
                                No evidence yet
                            </div>
                        )}
                        {mode !== 'show' ? <EvidenceUploader appraisalId={appraisalId} objectiveId={objective.id} /> : null}
                    </div>
                ) : mode === 'plan' ? (
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs">
                            <Checkbox
                                checked={objective.include_in_business_score}
                                onCheckedChange={(checked) => onChange?.(index, 'include_in_business_score', Boolean(checked))}
                            />
                            Include in score
                        </Label>
                        {onRemove ? (
                            <button type="button" className="text-xs text-rose-600 hover:underline" onClick={() => onRemove(index)}>
                                Remove
                            </button>
                        ) : null}
                    </div>
                ) : null}
            </td>
        </tr>
    );
}
