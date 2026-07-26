import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquareMore, ShieldCheck, Star } from 'lucide-react';
import type { CompetencyRating, RatingScaleLevel } from '@/types/performance';

interface CompetencyRatingTableProps {
    ratings: CompetencyRating[];
    mode: 'self' | 'manager' | 'show';
    ratingLevels: RatingScaleLevel[];
    onChange?: (index: number, field: string, value: string | number | null) => void;
}

export default function CompetencyRatingTable({ ratings, mode, ratingLevels, onChange }: CompetencyRatingTableProps) {
    if (mode === 'self' || mode === 'manager') {
        return (
            <div className="space-y-3">
                {ratings.map((rating, index) => {
                    const currentRatingLevelId =
                        mode === 'self' ? rating.self_rating_scale_level_id : rating.manager_rating_scale_level_id;

                    return (
                        <div key={rating.id} className="space-y-3 rounded-xl border bg-card p-4">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <div className="text-sm font-semibold text-foreground">{rating.competency?.name}</div>
                                    <div className="mt-1 text-xs text-muted-foreground">{rating.competency?.category}</div>
                                </div>
                                <div className="min-w-56">
                                    <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Star className="h-3.5 w-3.5" />
                                        {mode === 'self' ? 'Self rating' : 'Manager rating'}
                                    </div>
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
                                </div>
                            </div>

                            {mode === 'manager' ? (
                                <div className="space-y-2 rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
                                    Self rating:{' '}
                                    <span className="font-medium text-foreground">
                                        {ratingLevels.find((level) => level.id === rating.self_rating_scale_level_id)?.label ?? 'Not rated'}
                                    </span>
                                </div>
                            ) : null}

                            <div className={`grid gap-3 ${mode === 'manager' ? 'lg:grid-cols-2' : ''}`}>
                                {mode === 'manager' ? (
                                    <div>
                                        <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                            <MessageSquareMore className="h-3.5 w-3.5" />
                                            Employee comment
                                        </div>
                                        <textarea
                                            className="min-h-20 w-full rounded-md border bg-muted/20 px-3 py-2 text-sm"
                                            readOnly
                                            value={rating.employee_comment ?? ''}
                                        />
                                    </div>
                                ) : null}
                                <div>
                                    <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                        <MessageSquareMore className="h-3.5 w-3.5" />
                                        {mode === 'self' ? 'Employee comment' : 'Manager comment'}
                                    </div>
                                    <textarea
                                        className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                        value={mode === 'self' ? (rating.employee_comment ?? '') : (rating.manager_comment ?? '')}
                                        onChange={(event) =>
                                            onChange?.(index, mode === 'self' ? 'employee_comment' : 'manager_comment', event.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
                <thead className="bg-muted/50 text-left">
                    <tr>
                        <th className="p-2">Value</th>
                        <th className="p-2">Rating</th>
                        <th className="p-2">Comment</th>
                    </tr>
                </thead>
                <tbody>
                    {ratings.map((rating) => {
                        const currentRatingLevelId = rating.manager_rating_scale_level_id ?? rating.self_rating_scale_level_id;
                        const currentRatingLabel =
                            ratingLevels.find((level) => level.id === currentRatingLevelId)?.label ?? 'Not rated';

                        return (
                            <tr key={rating.id}>
                                <td className="p-2">
                                    <div className="font-medium">{rating.competency?.name}</div>
                                    <div className="text-xs text-muted-foreground">{rating.competency?.category}</div>
                                </td>
                                <td className="p-2">
                                    <Badge variant="outline" className="inline-flex items-center gap-1.5">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        {currentRatingLabel}
                                    </Badge>
                                </td>
                                <td className="p-2">
                                    <textarea
                                        className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                        readOnly
                                        value={rating.manager_comment ?? rating.employee_comment ?? ''}
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
