import { AsyncSearchSelect } from '@/components/async-search-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CircleCheckBig, Download, ExternalLink, FileText, Goal, Link2, MessageSquareMore, Target, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { GoalLibrarySearchOption, Objective, Option, RatingScaleLevel } from '@/types/performance';
import EvidenceUploader from './EvidenceUploader';

function FormField({ label, htmlFor, children, className }: { label: string; htmlFor?: string; children: ReactNode; className?: string }) {
    return (
        <div className={className}>
            <Label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {label}
            </Label>
            {children}
        </div>
    );
}

function PlanWeightInput({ id, value, onChange }: { id: string; value: number; onChange: (value: number) => void }) {
    const [draft, setDraft] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const displayValue = isFocused ? draft : value > 0 ? String(value) : '';

    const commitDraft = (raw: string) => {
        if (raw === '' || raw === '.') {
            onChange(0);
            return;
        }

        onChange(Math.min(100, Math.max(0, parseFloat(raw) || 0)));
    };

    return (
        <div className="relative">
            <Input
                id={id}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="e.g. 25"
                value={displayValue}
                onFocus={() => {
                    setIsFocused(true);
                    setDraft(value > 0 ? String(value) : '');
                }}
                onChange={(event) => {
                    const raw = event.target.value.replace(/[^0-9.]/g, '');
                    const normalized = raw.includes('.') ? raw.replace(/^(\d*\.?\d*).*$/, '$1') : raw;
                    setDraft(normalized);

                    if (normalized === '' || normalized === '.') {
                        onChange(0);
                        return;
                    }

                    const parsed = parseFloat(normalized);
                    if (!Number.isNaN(parsed)) {
                        onChange(Math.min(100, Math.max(0, parsed)));
                    }
                }}
                onBlur={() => {
                    commitDraft(draft);
                    setIsFocused(false);
                }}
                className="pr-8"
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">%</span>
        </div>
    );
}

function PlanTextArea({
    id,
    value,
    onChange,
    placeholder,
    rows = 3,
}: {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
}) {
    return (
        <textarea
            id={id}
            rows={rows}
            placeholder={placeholder}
            className="min-h-[4.5rem] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={value}
            onChange={(event) => onChange(event.target.value)}
        />
    );
}

interface ObjectiveFormRowProps {
    appraisalId?: number;
    objective: Objective;
    index: number;
    mode: 'plan' | 'self' | 'manager' | 'show';
    perspectiveOptions: Option[];
    ratingLevels?: RatingScaleLevel[];
    goalLibrarySearchEndpoint?: string;
    selectedGoalLibraryItemIds?: number[];
    allowStructuralEditing?: boolean;
    onChange?: (index: number, field: string, value: string | number | boolean | null) => void;
    onApplyGoalLibrary?: (index: number, goal: GoalLibrarySearchOption) => void;
    onRemove?: (index: number) => void;
}

export default function ObjectiveFormRow({
    appraisalId,
    objective,
    index,
    mode,
    perspectiveOptions,
    ratingLevels = [],
    goalLibrarySearchEndpoint,
    selectedGoalLibraryItemIds = [],
    allowStructuralEditing = true,
    onChange,
    onApplyGoalLibrary,
    onRemove,
}: ObjectiveFormRowProps) {
    const isPlan = mode === 'plan';
    const isSelf = mode === 'self';
    const isManager = mode === 'manager';
    const isShow = mode === 'show';
    const isReadOnly = isShow || ((isSelf || isManager) && !onChange);

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

    const fieldId = (suffix: string) => `objective-${index}-${suffix}`;
    const excludedGoalLibraryItemIds = selectedGoalLibraryItemIds.filter(
        (goalLibraryItemId) => goalLibraryItemId !== objective.goal_library_item_id,
    );
    const goalLibrarySearchExtraQuery =
        excludedGoalLibraryItemIds.length > 0
            ? { exclude: excludedGoalLibraryItemIds.join(',') }
            : undefined;

    if (isPlan) {
        return (
            <div className="relative space-y-5 rounded-xl border bg-card p-5 shadow-sm">
                {onRemove && allowStructuralEditing ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onRemove(index)}
                        aria-label={`Remove objective ${index + 1}`}
                        title="Remove objective"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                ) : null}
                <div className="flex items-center gap-2 border-b pb-4 pr-10">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-foreground">Objective {index + 1}</span>
                </div>

                {goalLibrarySearchEndpoint && allowStructuralEditing ? (
                    <FormField label="Goal from library" htmlFor={fieldId('library')}>
                        <AsyncSearchSelect<GoalLibrarySearchOption>
                            id={fieldId('library')}
                            endpoint={goalLibrarySearchEndpoint}
                            value={objective.goal_library_item_id ?? null}
                            extraQuery={goalLibrarySearchExtraQuery}
                            placeholder="Search goals for your department and role…"
                            emptyText="No matching goals. Try another keyword or enter details manually."
                            fallbackLabel={objective.goal_library_item_id ? objective.title : null}
                            onChange={(_value, option) => {
                                if (option) {
                                    onApplyGoalLibrary?.(index, option);
                                }
                            }}
                            renderOption={(option) => (
                                <div className="space-y-0.5">
                                    <div className="font-medium text-foreground">{option.label}</div>
                                    <div className="text-muted-foreground text-xs">
                                        {[option.perspective_name, option.job_title_name ? `Role: ${option.job_title_name}` : 'All roles']
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </div>
                                    {option.kpi_measure ? (
                                        <div className="text-muted-foreground line-clamp-1 text-xs">{option.kpi_measure}</div>
                                    ) : null}
                                </div>
                            )}
                        />
                    </FormField>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Perspective" htmlFor={fieldId('perspective')}>
                        <Select
                            value={String(objective.perspective_id ?? '')}
                            onValueChange={(value) => onChange?.(index, 'perspective_id', Number(value))}
                        >
                            <SelectTrigger id={fieldId('perspective')} className="w-full">
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
                    </FormField>

                    <FormField label="Objective title" htmlFor={fieldId('title')}>
                        <Input
                            id={fieldId('title')}
                            value={objective.title}
                            onChange={(event) => onChange?.(index, 'title', event.target.value)}
                            placeholder="What will you achieve this cycle?"
                            className="text-base"
                        />
                    </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Weight" htmlFor={fieldId('weight')}>
                        <PlanWeightInput
                            id={fieldId('weight')}
                            value={clampedWeightValue}
                            onChange={(weight) => onChange?.(index, 'weight', weight)}
                        />
                    </FormField>

                    <div className="flex items-end pb-1">
                        <Label htmlFor={fieldId('include-score')} className="flex cursor-pointer items-center gap-2 text-sm">
                            <Checkbox
                                id={fieldId('include-score')}
                                checked={objective.include_in_business_score}
                                onCheckedChange={(checked) => onChange?.(index, 'include_in_business_score', Boolean(checked))}
                            />
                            Include in business score
                        </Label>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <FormField label="KPI / measure" htmlFor={fieldId('kpi')}>
                        <PlanTextArea
                            id={fieldId('kpi')}
                            value={objective.kpi_measure ?? ''}
                            placeholder="How progress will be measured"
                            onChange={(value) => onChange?.(index, 'kpi_measure', value)}
                        />
                    </FormField>

                    <FormField label="Target" htmlFor={fieldId('target')}>
                        <PlanTextArea
                            id={fieldId('target')}
                            value={objective.target_definition ?? ''}
                            placeholder="Specific outcome or threshold"
                            onChange={(value) => onChange?.(index, 'target_definition', value)}
                        />
                    </FormField>
                </div>

                <FormField label="Evidence source" htmlFor={fieldId('evidence')}>
                    <Input
                        id={fieldId('evidence')}
                        value={objective.evidence_source ?? ''}
                        onChange={(event) => onChange?.(index, 'evidence_source', event.target.value)}
                        placeholder="e.g. monthly report, system export, manager sign-off"
                    />
                </FormField>
            </div>
        );
    }

    return (
        <div className="space-y-4 rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">{objective.title}</div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{currentPerspectiveLabel}</Badge>
                        <span>Weight {clampedWeightValue}%</span>
                    </div>
                </div>

                <div className="min-w-56">
                    {isShow ? (
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
                                disabled={isReadOnly}
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
                    <div className="text-sm text-foreground">{objective.kpi_measure || '-'}</div>
                </div>
                <div className="rounded-md border bg-muted/20 p-3">
                    <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <CircleCheckBig className="h-3.5 w-3.5" />
                        Target
                    </div>
                    <div className="text-sm text-foreground">{objective.target_definition || '-'}</div>
                </div>
            </div>

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
                        readOnly={isReadOnly || isManager || (isSelf && !onChange)}
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
                        onChange={(event) => onChange?.(index, isManager ? 'manager_comment' : 'employee_comment', event.target.value)}
                        readOnly={isReadOnly}
                    />
                </div>
            </div>

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
        </div>
    );
}
