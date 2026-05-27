import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { IssueOption, IssueType } from '@/types/issues';

const selectClassName =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

interface IssueDetailsFormFieldsProps {
    idPrefix?: string;
    type: IssueType;
    title: string;
    description: string;
    typeOptions: IssueOption[];
    errors: Partial<Record<'type' | 'title' | 'description', string>>;
    onTypeChange: (value: IssueType) => void;
    onTitleChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
}

export default function IssueDetailsFormFields({
    idPrefix = 'issue',
    type,
    title,
    description,
    typeOptions,
    errors,
    onTypeChange,
    onTitleChange,
    onDescriptionChange,
}: IssueDetailsFormFieldsProps) {
    return (
        <>
            <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-type`}>Issue type</Label>
                <select
                    id={`${idPrefix}-type`}
                    className={selectClassName}
                    value={type}
                    onChange={(event) => onTypeChange(event.target.value as IssueType)}
                    required
                >
                    {typeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {errors.type ? <p className="text-destructive text-sm">{errors.type}</p> : null}
            </div>

            <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-title`}>Title / summary</Label>
                <Input
                    id={`${idPrefix}-title`}
                    value={title}
                    onChange={(event) => onTitleChange(event.target.value)}
                    required
                />
                {errors.title ? <p className="text-destructive text-sm">{errors.title}</p> : null}
            </div>

            <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-description`}>Description</Label>
                <textarea
                    id={`${idPrefix}-description`}
                    rows={6}
                    className="border-input bg-background focus-visible:ring-ring min-h-[8rem] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                    value={description}
                    onChange={(event) => onDescriptionChange(event.target.value)}
                    required
                />
                {errors.description ? <p className="text-destructive text-sm">{errors.description}</p> : null}
            </div>
        </>
    );
}
