import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck } from 'lucide-react';
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
                    {ratings.map((rating, index) => {
                        const currentRatingLevelId =
                            mode === 'self'
                                ? rating.self_rating_scale_level_id
                                : mode === 'manager'
                                  ? rating.manager_rating_scale_level_id
                                  : rating.manager_rating_scale_level_id ?? rating.self_rating_scale_level_id;
                        const currentRatingLabel =
                            ratingLevels.find((level) => level.id === currentRatingLevelId)?.label ?? 'Not rated';

                        return (
                            <tr key={rating.id}>
                                <td className="p-2">
                                    <div className="font-medium">{rating.competency?.name}</div>
                                    <div className="text-xs text-muted-foreground">{rating.competency?.category}</div>
                                </td>
                                <td className="p-2">
                                    {mode === 'show' ? (
                                        <Badge variant="outline" className="inline-flex items-center gap-1.5">
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                            {currentRatingLabel}
                                        </Badge>
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
                                                <SelectValue placeholder="Select" />
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
                                    <textarea
                                        className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                        readOnly={mode === 'show'}
                                        value={
                                            mode === 'self'
                                                ? (rating.employee_comment ?? '')
                                                : mode === 'manager'
                                                  ? (rating.manager_comment ?? '')
                                                  : (rating.manager_comment ?? rating.employee_comment ?? '')
                                        }
                                        onChange={(event) =>
                                            onChange?.(index, mode === 'self' ? 'employee_comment' : 'manager_comment', event.target.value)
                                        }
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
