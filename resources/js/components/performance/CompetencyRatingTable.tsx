import type { CompetencyRating, RatingScaleLevel } from '@/types/performance';

interface CompetencyRatingTableProps {
    ratings: CompetencyRating[];
    mode: 'self' | 'manager' | 'show';
    ratingLevels: RatingScaleLevel[];
    onChange?: (index: number, field: string, value: string | number | null) => void;
}

export default function CompetencyRatingTable({ ratings, mode, ratingLevels, onChange }: CompetencyRatingTableProps) {
    return (
        <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
                <thead className="bg-muted/50 text-left">
                    <tr>
                        <th className="p-2">Competency</th>
                        <th className="p-2">Rating</th>
                        <th className="p-2">Comment</th>
                    </tr>
                </thead>
                <tbody>
                    {ratings.map((rating, index) => (
                        <tr key={rating.id}>
                            <td className="p-2">
                                <div className="font-medium">{rating.competency?.name}</div>
                                <div className="text-xs text-muted-foreground">{rating.competency?.category}</div>
                            </td>
                            <td className="p-2">
                                <select
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    disabled={mode === 'show'}
                                    value={mode === 'self' ? (rating.self_rating_scale_level_id ?? '') : mode === 'manager' ? (rating.manager_rating_scale_level_id ?? '') : ''}
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
                            </td>
                            <td className="p-2">
                                <textarea
                                    className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    readOnly={mode === 'show'}
                                    value={mode === 'self' ? (rating.employee_comment ?? '') : mode === 'manager' ? (rating.manager_comment ?? '') : ''}
                                    onChange={(event) => onChange?.(index, mode === 'self' ? 'employee_comment' : 'manager_comment', event.target.value)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
