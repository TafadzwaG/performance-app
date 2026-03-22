import { Button } from '@/components/ui/button';
import type { Option, TemplateItem } from '@/types/performance';

interface TemplateItemBuilderProps {
    items: TemplateItem[];
    perspectiveOptions: Option[];
    competencyOptions: Option[];
    onChange: (items: TemplateItem[]) => void;
}

export default function TemplateItemBuilder({ items, perspectiveOptions, competencyOptions, onChange }: TemplateItemBuilderProps) {
    const updateItem = (index: number, field: keyof TemplateItem, value: boolean | number | string | null) => {
        const next = [...items];
        next[index] = { ...next[index], [field]: value };
        onChange(next);
    };

    const addItem = (itemType: 'objective' | 'competency') => {
        onChange([
            ...items,
            {
                item_type: itemType,
                title: '',
                sort_order: items.length,
                is_required: true,
                default_weight: itemType === 'objective' ? 0 : null,
            },
        ]);
    };

    const removeItem = (index: number) => {
        onChange(items.filter((_, itemIndex) => itemIndex !== index).map((item, itemIndex) => ({ ...item, sort_order: itemIndex })));
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => addItem('objective')}>
                    Add objective item
                </Button>
                <Button type="button" variant="outline" onClick={() => addItem('competency')}>
                    Add competency item
                </Button>
            </div>
            <div className="space-y-3">
                {items.map((item, index) => (
                    <div key={`${item.item_type}-${index}`} className="grid gap-3 rounded-lg border p-4 md:grid-cols-6">
                        <select
                            className="rounded-md border bg-background px-3 py-2 text-sm"
                            value={item.item_type}
                            onChange={(event) => updateItem(index, 'item_type', event.target.value)}
                        >
                            <option value="objective">Objective</option>
                            <option value="competency">Competency</option>
                        </select>
                        {item.item_type === 'objective' ? (
                            <select
                                className="rounded-md border bg-background px-3 py-2 text-sm"
                                value={item.perspective_id ?? ''}
                                onChange={(event) => updateItem(index, 'perspective_id', event.target.value ? Number(event.target.value) : null)}
                            >
                                <option value="">Perspective</option>
                                {perspectiveOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <select
                                className="rounded-md border bg-background px-3 py-2 text-sm"
                                value={item.competency_id ?? ''}
                                onChange={(event) => updateItem(index, 'competency_id', event.target.value ? Number(event.target.value) : null)}
                            >
                                <option value="">Competency</option>
                                {competencyOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        )}
                        <input
                            className="rounded-md border bg-background px-3 py-2 text-sm md:col-span-2"
                            value={item.title}
                            onChange={(event) => updateItem(index, 'title', event.target.value)}
                            placeholder="Item title"
                        />
                        <input
                            className="rounded-md border bg-background px-3 py-2 text-sm"
                            type="number"
                            value={item.default_weight ?? 0}
                            onChange={(event) => updateItem(index, 'default_weight', Number(event.target.value))}
                            placeholder="Weight"
                            disabled={item.item_type !== 'objective'}
                        />
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={item.is_required}
                                onChange={(event) => updateItem(index, 'is_required', event.target.checked)}
                            />
                            Required
                        </label>
                        <textarea
                            className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm md:col-span-5"
                            value={item.description ?? ''}
                            onChange={(event) => updateItem(index, 'description', event.target.value)}
                            placeholder="Description"
                        />
                        <div className="flex items-center justify-end md:col-span-1">
                            <Button type="button" variant="outline" onClick={() => removeItem(index)}>
                                Remove
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
