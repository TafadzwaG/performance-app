import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CircleCheckBig, Download, ExternalLink, FileText, Goal, Link2, MessageSquareMore, Target, Trash2 } from 'lucide-react';
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
    allowStructuralEditing?: boolean;
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
    allowStructuralEditing = true,
    onChange,
    onRemove,
}: ObjectiveFormRowProps) {
    const isPlan = mode === 'plan';
    const isSelf = mode === 'self';
    const isManager = mode === 'manager';
    const isShow = mode === 'show';
    const isReadOnly = isShow;

    const currentRatingLevelId =
        isSelf
            ? objective.self_rating_scale_level_id
            : isManager
              ? objective.manager_rating_scale_level_id
              : objective.manager_rating_scale_level_id ?? objective.self_rating_scale_level_id;
    const currentRatingLabel = ratingLevels.find((level) => level.id === currentRatingLevelId)?.label ?? 'Not rated';
    const selfRatingLabel = ratingLevels.find((level) => level.id === objective.self_rating_scale_level_id)?.label ?? 'Not rated';
    const currentPerspectiveLabel =
        perspectiveOptions.find((option) => Number(option.value) === Number(objective.perspective_id))?.label ?? '-';
    const weightValue = Number(objective.weight ?? 0);
    const clampedWeightValue = Number.isFinite(weightValue) ? Math.max(0, Math.min(100, weightValue)) : 0;

    const evidenceDownloadHref = (evidenceId: number) =>
        route('performance.appraisals.evidence.download', {
            appraisal: appraisalId,
            objective: objective.id,
            evidence: evidenceId,
        });

    return (
        <div className="space-y-4 rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                    {isPlan ? (
                        <div className="space-y-2">
                            {goalLibraryItems.length > 0 && allowStructuralEditing ? (
                                <Select
                                    value={objective.goal_library_item_id ? String(objective.goal_library_item_id) : '__none__'}
                                    onValueChange={(value) =>
                                        onChange?.(index, 'goal_library_item_id', value === '__none__' ? null : Number(value))
                                    }
                                >
                                    <SelectTrigger className="w-full md:max-w-sm">
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
                                placeholder="Objective title"
                            />
                        </div>
                    ) : (
                        <div className="text-sm font-semibold text-foreground">{objective.title}</div>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {isPlan ? (
                            <Select
                                value={String(objective.perspective_id ?? '')}
                                onValueChange={(value) => onChange?.(index, 'perspective_id', Number(value))}
                            >
                                <SelectTrigger className="h-8 w-[190px]">
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
                            <Badge variant="outline">{currentPerspectiveLabel}</Badge>
                        )}
                        <span>Weight {clampedWeightValue}%</span>
                    </div>
                </div>

                <div className="min-w-56">
                    {isPlan ? (
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Weight</Label>
                            <Input
                                className="w-24"
                                type="number"
                                value={objective.weight}
                                onChange={(event) => onChange?.(index, 'weight', Number(event.target.value))}
                            />
                        </div>
                    ) : isShow ? (
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Final rating</Label>
                            <Badge variant="outline">{currentRatingLabel}</Badge>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">{isSelf ? 'Self rating' : 'Manager rating'}</Label>
                            {isManager ? (
                                <div className="text-xs text-muted-foreground">
                                    Self rating: <span className="font-medium text-foreground">{selfRatingLabel}</span>
                                </div>
                            ) : null}
                            <Select
                                value={currentRatingLevelId ? String(currentRatingLevelId) : '__none__'}
                                onValueChange={(value) =>
                                    onChange?.(
                                        index,
                                        isSelf ? 'self_rating_scale_level_id' : 'manager_rating_scale_level_id',
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
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-md border bg-muted/20 p-3">
                    <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Goal className="h-3.5 w-3.5" />
                        KPI / Measure
                    </div>
                    {isPlan ? (
                        <textarea
                            className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={objective.kpi_measure ?? ''}
                            onChange={(event) => onChange?.(index, 'kpi_measure', event.target.value)}
                        />
                    ) : (
                        <div className="text-sm text-foreground">{objective.kpi_measure || '-'}</div>
                    )}
                </div>
                <div className="rounded-md border bg-muted/20 p-3">
                    <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <CircleCheckBig className="h-3.5 w-3.5" />
                        Target
                    </div>
                    {isPlan ? (
                        <textarea
                            className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={objective.target_definition ?? ''}
                            onChange={(event) => onChange?.(index, 'target_definition', event.target.value)}
                        />
                    ) : (
                        <div className="text-sm text-foreground">{objective.target_definition || '-'}</div>
                    )}
                </div>
            </div>

            {isPlan ? (
                <div className="grid gap-3 lg:grid-cols-2">
                    <div>
                        <div className="mb-1 text-xs font-medium text-muted-foreground">Evidence source</div>
                        <Input
                            value={objective.evidence_source ?? ''}
                            onChange={(event) => onChange?.(index, 'evidence_source', event.target.value)}
                        />
                    </div>
                    <div className="flex items-end justify-between gap-2">
                        <Label className="flex items-center gap-2 text-xs">
                            <Checkbox
                                checked={objective.include_in_business_score}
                                onCheckedChange={(checked) => onChange?.(index, 'include_in_business_score', Boolean(checked))}
                            />
                            Include in score
                        </Label>
                        {onRemove && allowStructuralEditing ? (
                            <Button type="button" variant="destructive" size="sm" onClick={() => onRemove(index)}>
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                Remove objective
                            </Button>
                        ) : null}
                    </div>
                </div>
            ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                    <div>
                        <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <Target className="h-3.5 w-3.5" />
                            {isManager ? 'Employee achieved' : 'Performance achieved'}
                        </div>
                        <textarea
                            className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={objective.performance_achieved ?? ''}
                            onChange={(event) => (isSelf ? onChange?.(index, 'performance_achieved', event.target.value) : undefined)}
                            readOnly={isReadOnly || isManager}
                        />
                    </div>
                    <div>
                        <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <MessageSquareMore className="h-3.5 w-3.5" />
                            {isManager ? 'Manager comment' : 'Employee comment'}
                        </div>
                        <textarea
                            className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={(isManager ? objective.manager_comment : objective.employee_comment) ?? ''}
                            onChange={(event) =>
                                onChange?.(index, isManager ? 'manager_comment' : 'employee_comment', event.target.value)
                            }
                            readOnly={isShow}
                        />
                    </div>
                </div>
            )}

            {isPlan ? null : (
                <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Evidence</div>
                    {appraisalId && objective.evidences?.length ? (
                        objective.evidences.map((evidence) => {
                            const isLink = evidence.evidence_type === 'link';

                            return (
                                <div key={evidence.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/20 px-2.5 py-2">
                                    <div className="flex min-w-0 items-center gap-2 text-xs text-foreground">
                                        {isLink ? <Link2 className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                                        <span className="truncate">{evidence.original_name ?? evidence.url ?? evidence.path ?? `Evidence #${evidence.id}`}</span>
                                    </div>
                                    <Button asChild type="button" size="sm" variant="outline" className="h-7 px-2.5 text-xs">
                                        <a
                                            href={isLink && evidence.url ? evidence.url : evidenceDownloadHref(evidence.id)}
                                            target={isLink ? '_blank' : undefined}
                                            rel={isLink ? 'noreferrer' : undefined}
                                        >
                                            {isLink ? <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> : <Download className="mr-1.5 h-3.5 w-3.5" />}
                                            {isLink ? 'Open link' : 'Download'}
                                        </a>
                                    </Button>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex items-center gap-1.5 rounded-md border border-dashed bg-muted/20 px-2 py-1.5 text-xs text-muted-foreground">
                            <Target className="h-3.5 w-3.5" />
                            No evidence yet
                        </div>
                    )}
                    {appraisalId && !isShow ? <EvidenceUploader appraisalId={appraisalId} objectiveId={objective.id} /> : null}
                </div>
            )}
        </div>
    );
}
