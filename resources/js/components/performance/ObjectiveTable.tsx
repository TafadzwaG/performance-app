import { Button } from '@/components/ui/button';
import { Plus, Target } from 'lucide-react';
import type { GoalLibrarySearchOption, Objective, Option, RatingScaleLevel } from '@/types/performance';
import ObjectiveFormRow from './ObjectiveFormRow';

interface ObjectiveTableProps {
    appraisalId?: number;
    objectives: Objective[];
    mode: 'plan' | 'self' | 'manager' | 'show';
    perspectiveOptions: Option[];
    ratingLevels?: RatingScaleLevel[];
    goalLibrarySearchEndpoint?: string;
    allowStructuralEditing?: boolean;
    onChange?: (index: number, field: string, value: string | number | boolean | null) => void;
    onApplyGoalLibrary?: (index: number, goal: GoalLibrarySearchOption) => void;
    onAdd?: () => void;
    onRemove?: (index: number) => void;
}

export default function ObjectiveTable(props: ObjectiveTableProps) {
    return (
        <div className="space-y-5">
            {props.objectives.map((objective, index) => (
                <ObjectiveFormRow
                    key={objective.id ?? index}
                    appraisalId={props.appraisalId}
                    objective={objective}
                    index={index}
                    mode={props.mode}
                    perspectiveOptions={props.perspectiveOptions}
                    ratingLevels={props.ratingLevels}
                    goalLibrarySearchEndpoint={props.goalLibrarySearchEndpoint}
                    allowStructuralEditing={props.allowStructuralEditing}
                    onChange={props.onChange}
                    onApplyGoalLibrary={props.onApplyGoalLibrary}
                    onRemove={props.onRemove}
                />
            ))}
            {props.mode === 'plan' && props.onAdd && props.allowStructuralEditing !== false ? (
                <Button type="button" variant="outline" onClick={props.onAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    <Target className="mr-2 h-4 w-4 text-primary" />
                    Add objective
                </Button>
            ) : null}
        </div>
    );
}
