import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Option, TemplateItem } from '@/types/performance';
import {
    Brain,
    ClipboardList,
    GripVertical,
    Layers3,
    Plus,
    Scale,
    Target,
    Trash2,
} from 'lucide-react';

interface TemplateItemBuilderProps {
    items: TemplateItem[];
    perspectiveOptions: Option[];
    competencyOptions: Option[];
    onChange: (items: TemplateItem[]) => void;
}

function getItemIcon(itemType: string) {
    return itemType === 'objective' ? Target : Brain;
}

function getItemLabel(itemType: string) {
    return itemType === 'objective' ? 'Objective' : 'Competency';
}

export default function TemplateItemBuilder({
    items,
    perspectiveOptions,
    competencyOptions,
    onChange,
}: TemplateItemBuilderProps) {
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
        onChange(
            items
                .filter((_, itemIndex) => itemIndex !== index)
                .map((item, itemIndex) => ({ ...item, sort_order: itemIndex })),
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline">Template Items</Badge>
                        <span className="text-xs text-muted-foreground">
                            {items.length} configured item{items.length === 1 ? '' : 's'}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Add objective and competency items, then define weights, descriptions, and requirement rules.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => addItem('objective')}>
                        <Target className="mr-2 h-4 w-4" />
                        Add Objective
                    </Button>
                    <Button type="button" variant="outline" onClick={() => addItem('competency')}>
                        <Brain className="mr-2 h-4 w-4" />
                        Add Competency
                    </Button>
                </div>
            </div>

            {items.length === 0 ? (
                <Card className="shadow-none">
                    <CardContent className="flex min-h-[220px] items-center justify-center p-6">
                        <div className="space-y-3 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-muted/30">
                                <ClipboardList className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">No template items yet</h3>
                                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                    Start by adding an objective or competency item to define what this template will
                                    evaluate.
                                </p>
                            </div>
                            <div className="flex justify-center gap-2">
                                <Button type="button" variant="outline" onClick={() => addItem('objective')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Objective
                                </Button>
                                <Button type="button" variant="outline" onClick={() => addItem('competency')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Competency
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {items.map((item, index) => {
                        const Icon = getItemIcon(item.item_type);

                        return (
                            <Card key={`${item.item_type}-${index}`} className="shadow-none">
                                <CardHeader className="border-b bg-muted/10 pb-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background text-muted-foreground">
                                                <Icon className="h-4.5 w-4.5" />
                                            </div>

                                            <div>
                                                <CardTitle className="text-base">
                                                    {item.title?.trim() || `${getItemLabel(item.item_type)} Item ${index + 1}`}
                                                </CardTitle>
                                                <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                                                    <span className="inline-flex items-center gap-1">
                                                        <GripVertical className="h-3.5 w-3.5" />
                                                        Order {index + 1}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{getItemLabel(item.item_type)}</span>
                                                </CardDescription>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Badge variant={item.is_required ? 'secondary' : 'outline'}>
                                                {item.is_required ? 'Required' : 'Optional'}
                                            </Badge>

                                            <Button type="button" variant="outline" size="sm" onClick={() => removeItem(index)}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-6 p-6">
                                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
                                        <div className="space-y-2">
                                            <Label htmlFor={`item-type-${index}`}>Item Type</Label>
                                            <select
                                                id={`item-type-${index}`}
                                                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                value={item.item_type}
                                                onChange={(event) => updateItem(index, 'item_type', event.target.value)}
                                            >
                                                <option value="objective">Objective</option>
                                                <option value="competency">Competency</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor={`item-link-${index}`}>
                                                {item.item_type === 'objective' ? 'Perspective' : 'Competency'}
                                            </Label>

                                            {item.item_type === 'objective' ? (
                                                <select
                                                    id={`item-link-${index}`}
                                                    className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                    value={item.perspective_id ?? ''}
                                                    onChange={(event) =>
                                                        updateItem(
                                                            index,
                                                            'perspective_id',
                                                            event.target.value ? Number(event.target.value) : null,
                                                        )
                                                    }
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
                                                    id={`item-link-${index}`}
                                                    className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                    value={item.competency_id ?? ''}
                                                    onChange={(event) =>
                                                        updateItem(
                                                            index,
                                                            'competency_id',
                                                            event.target.value ? Number(event.target.value) : null,
                                                        )
                                                    }
                                                >
                                                    <option value="">Competency</option>
                                                    {competencyOptions.map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        <div className="space-y-2 xl:col-span-2">
                                            <Label htmlFor={`item-title-${index}`}>Item Title</Label>
                                            <Input
                                                id={`item-title-${index}`}
                                                value={item.title}
                                                onChange={(event) => updateItem(index, 'title', event.target.value)}
                                                placeholder="Item title"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor={`item-weight-${index}`}>Default Weight</Label>
                                            <div className="relative">
                                                <Scale className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    id={`item-weight-${index}`}
                                                    className="pl-9"
                                                    type="number"
                                                    value={item.default_weight ?? 0}
                                                    onChange={(event) =>
                                                        updateItem(index, 'default_weight', Number(event.target.value))
                                                    }
                                                    placeholder="Weight"
                                                    disabled={item.item_type !== 'objective'}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
                                        <div className="space-y-2">
                                            <Label htmlFor={`item-description-${index}`}>Description</Label>
                                            <textarea
                                                id={`item-description-${index}`}
                                                className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                value={item.description ?? ''}
                                                onChange={(event) => updateItem(index, 'description', event.target.value)}
                                                placeholder="Description"
                                            />
                                        </div>

                                        <div className="flex min-w-[180px] items-start">
                                            <div className="flex w-full items-start space-x-3 rounded-lg border bg-muted/20 p-4">
                                                <Checkbox
                                                    id={`item-required-${index}`}
                                                    checked={item.is_required}
                                                    onCheckedChange={(checked) =>
                                                        updateItem(index, 'is_required', checked === true)
                                                    }
                                                />
                                                <div className="space-y-1">
                                                    <Label htmlFor={`item-required-${index}`} className="font-medium">
                                                        Required
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        This item must be completed during appraisal.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-3">
                                        <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm">
                                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                                Type
                                            </div>
                                            <div className="mt-1 font-medium text-foreground">
                                                {getItemLabel(item.item_type)}
                                            </div>
                                        </div>

                                        <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm">
                                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                                Weight
                                            </div>
                                            <div className="mt-1 font-medium text-foreground">
                                                {item.item_type === 'objective'
                                                    ? `${item.default_weight ?? 0}%`
                                                    : 'Not weighted'}
                                            </div>
                                        </div>

                                        <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm">
                                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                                Order
                                            </div>
                                            <div className="mt-1 font-medium text-foreground">{index + 1}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}