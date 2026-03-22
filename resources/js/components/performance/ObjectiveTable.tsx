import { Button } from '@/components/ui/button';
import type { GoalLibraryItem, Objective, Option, RatingScaleLevel } from '@/types/performance';
import ObjectiveFormRow from './ObjectiveFormRow';

interface ObjectiveTableProps {
    appraisalId?: number;
    objectives: Objective[];
    mode: 'plan' | 'self' | 'manager' | 'show';
    perspectiveOptions: Option[];
    ratingLevels?: RatingScaleLevel[];
    goalLibraryItems?: GoalLibraryItem[];
    onChange?: (index: number, field: string, value: string | number | boolean | null) => void;
    onAdd?: () => void;
    onRemove?: (index: number) => void;
}

export default function ObjectiveTable(props: ObjectiveTableProps) {
    return (
        <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                        <tr>
                            <th className="p-2">Perspective</th>
                            <th className="p-2">Objective</th>
                            <th className="p-2">{props.mode === 'self' ? 'Performance achieved' : props.mode === 'manager' ? 'Manager comment' : 'KPI / Measure'}</th>
                            <th className="p-2">Target</th>
                            <th className="p-2">Weight</th>
                            <th className="p-2">{props.mode === 'plan' ? 'Evidence source' : 'Rating'}</th>
                            <th className="p-2">Evidence / Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.objectives.map((objective, index) => (
                            <ObjectiveFormRow
                                key={objective.id ?? index}
                                appraisalId={props.appraisalId}
                                objective={objective}
                                index={index}
                                mode={props.mode}
                                perspectiveOptions={props.perspectiveOptions}
                                ratingLevels={props.ratingLevels}
                                goalLibraryItems={props.goalLibraryItems}
                                onChange={props.onChange}
                                onRemove={props.onRemove}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
            {props.mode === 'plan' && props.onAdd ? (
                <Button type="button" variant="outline" onClick={props.onAdd}>
                    Add objective
                </Button>
            ) : null}
        </div>
    );
}
