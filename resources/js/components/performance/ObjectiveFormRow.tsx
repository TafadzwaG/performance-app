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

    return (
        <tr className="align-top">
            <td className="p-2">
                <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    disabled={mode !== 'plan'}
                    value={objective.perspective_id}
                    onChange={(event) => onChange?.(index, 'perspective_id', Number(event.target.value))}
                >
                    {perspectiveOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </td>
            <td className="p-2">
                {mode === 'plan' && goalLibraryItems.length > 0 ? (
                    <select
                        className="mb-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={objective.goal_library_item_id ?? ''}
                        onChange={(event) => onChange?.(index, 'goal_library_item_id', event.target.value ? Number(event.target.value) : null)}
                    >
                        <option value="">Goal library option</option>
                        {goalLibraryItems.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.title}
                            </option>
                        ))}
                    </select>
                ) : null}
                <input
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
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
                <input
                    className="w-24 rounded-md border bg-background px-3 py-2 text-sm"
                    type="number"
                    value={objective.weight}
                    onChange={(event) => onChange?.(index, 'weight', Number(event.target.value))}
                    readOnly={mode !== 'plan'}
                />
            </td>
            <td className="p-2">
                {mode === 'plan' ? (
                    <input
                        className="w-32 rounded-md border bg-background px-3 py-2 text-sm"
                        value={objective.evidence_source ?? ''}
                        onChange={(event) => onChange?.(index, 'evidence_source', event.target.value)}
                    />
                ) : (
                    <select
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        disabled={isReadOnly}
                        value={
                            mode === 'self'
                                ? objective.self_rating_scale_level_id ?? ''
                                : mode === 'manager'
                                  ? objective.manager_rating_scale_level_id ?? ''
                                  : ''
                        }
                        onChange={(event) =>
                            onChange?.(
                                index,
                                mode === 'self' ? 'self_rating_scale_level_id' : 'manager_rating_scale_level_id',
                                event.target.value ? Number(event.target.value) : null,
                            )
                        }
                    >
                        <option value="">Select</option>
                        {ratingLevels.map((level) => (
                            <option key={level.id} value={level.id}>
                                {level.label}
                            </option>
                        ))}
                    </select>
                )}
            </td>
            <td className="p-2">
                {appraisalId && mode !== 'plan' ? (
                    <div className="space-y-2">
                        {objective.evidences?.map((evidence) => (
                            <div key={evidence.id} className="text-xs text-muted-foreground">
                                {evidence.original_name ?? evidence.url ?? evidence.path}
                            </div>
                        ))}
                        <EvidenceUploader appraisalId={appraisalId} objectiveId={objective.id} />
                    </div>
                ) : mode === 'plan' ? (
                    <label className="flex items-center gap-2 text-xs">
                        <input
                            type="checkbox"
                            checked={objective.include_in_business_score}
                            onChange={(event) => onChange?.(index, 'include_in_business_score', event.target.checked)}
                        />
                        Include in score
                    </label>
                ) : null}
                {mode === 'plan' && onRemove ? (
                    <button type="button" className="mt-2 text-xs text-rose-600" onClick={() => onRemove(index)}>
                        Remove
                    </button>
                ) : null}
            </td>
        </tr>
    );
}
