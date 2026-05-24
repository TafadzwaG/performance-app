import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import type { EmployeeFieldConfigItem, EmployeeFieldConfigScreen } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import {
    Blocks,
    CheckCircle2,
    Eye,
    FileText,
    Fingerprint,
    GripVertical,
    Layers3,
    LayoutPanelTop,
    Lock,
    RefreshCw,
    Save,
    Settings2,
    ShieldCheck,
    Sparkles,
    SquareStack,
    Type,
    Users2,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface Props {
    screens: EmployeeFieldConfigScreen[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Employee Field Settings', href: route('performance.setup.employee_fields.edit') },
];

const screenIcons = [Users2, LayoutPanelTop, FileText, ShieldCheck, Layers3, SquareStack];

function syncScreenFields(
    targetScreen: EmployeeFieldConfigScreen,
    sourceScreen: EmployeeFieldConfigScreen,
): { fields: EmployeeFieldConfigItem[]; syncedCount: number } {
    const sourceByKey = new Map(sourceScreen.fields.map((field) => [field.field_key, field]));
    let syncedCount = 0;

    const fields = targetScreen.fields.map((targetField) => {
        const sourceField = sourceByKey.get(targetField.field_key);

        if (!sourceField) {
            return targetField;
        }

        syncedCount++;

        return {
            ...targetField,
            enabled: sourceField.enabled,
            required: sourceField.required,
            display_order: sourceField.display_order,
        };
    });

    return { fields, syncedCount };
}

export default function EmployeeFieldSettingsEdit({ screens }: Props) {
    const form = useForm<{ screens: EmployeeFieldConfigScreen[] }>({ screens });
    const [activeScreenKey, setActiveScreenKey] = useState(screens[0]?.key ?? '');
    const [syncSourceKey, setSyncSourceKey] = useState('');
    const [syncMessage, setSyncMessage] = useState<string | null>(null);

    const activeScreenIndex = form.data.screens.findIndex((screen) => screen.key === activeScreenKey);
    const activeScreen = activeScreenIndex >= 0 ? form.data.screens[activeScreenIndex] : form.data.screens[0];

    const syncSourceOptions = useMemo(
        () => form.data.screens.filter((screen) => screen.key !== activeScreen?.key),
        [activeScreen?.key, form.data.screens],
    );

    const totalScreens = form.data.screens.length;
    const totalFields = form.data.screens.reduce((sum, screen) => sum + screen.fields.length, 0);
    const enabledFields = form.data.screens.reduce(
        (sum, screen) => sum + screen.fields.filter((field) => field.enabled).length,
        0,
    );
    const requiredFields = form.data.screens.reduce(
        (sum, screen) => sum + screen.fields.filter((field) => field.required).length,
        0,
    );

    const updateField = (
        screenIndex: number,
        fieldIndex: number,
        updater: (field: EmployeeFieldConfigScreen['fields'][number]) => EmployeeFieldConfigScreen['fields'][number],
    ) => {
        setSyncMessage(null);
        form.setData(
            'screens',
            form.data.screens.map((currentScreen, currentScreenIndex) =>
                currentScreenIndex !== screenIndex
                    ? currentScreen
                    : {
                          ...currentScreen,
                          fields: currentScreen.fields.map((currentField, currentFieldIndex) =>
                              currentFieldIndex !== fieldIndex ? currentField : updater(currentField),
                          ),
                      },
            ),
        );
    };

    const handleSyncFromSource = (sourceKey: string) => {
        if (!activeScreen || !sourceKey) {
            return;
        }

        const sourceScreen = form.data.screens.find((screen) => screen.key === sourceKey);

        if (!sourceScreen) {
            return;
        }

        const { fields, syncedCount } = syncScreenFields(activeScreen, sourceScreen);

        form.setData(
            'screens',
            form.data.screens.map((screen) =>
                screen.key === activeScreen.key
                    ? {
                          ...screen,
                          fields,
                      }
                    : screen,
            ),
        );

        setSyncMessage(
            syncedCount > 0
                ? `Synced ${syncedCount} matching field${syncedCount === 1 ? '' : 's'} from ${sourceScreen.label}. Save to persist.`
                : `No shared fields found between ${activeScreen.label} and ${sourceScreen.label}.`,
        );
    };

    return (
        <PerformancePage
            title="Employee Field Settings"
            description="Design a cleaner employee experience by controlling which profile fields appear, which ones are required, and how they are ordered."
            breadcrumbs={breadcrumbs}
        >
            <form
                className="space-y-6"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.put(route('performance.setup.employee_fields.update'));
                }}
            >
                <Card className="overflow-hidden border-0 shadow-lg">
                    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background">
                        <CardHeader className="gap-4 pb-4">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-3">
                                    <Badge variant="secondary" className="w-fit gap-1.5 px-3 py-1">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Field experience controls
                                    </Badge>
                                    <div className="space-y-1.5">
                                        <CardTitle className="flex items-center gap-2 text-2xl">
                                            <Settings2 className="h-6 w-6" />
                                            Employee Field Configuration
                                        </CardTitle>
                                        <CardDescription className="max-w-2xl text-sm leading-6">
                                            Configure each screen in its own tab. Sync visibility and requirement rules from another screen when you want them to match.
                                        </CardDescription>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-start rounded-2xl border bg-background/80 p-2 shadow-sm backdrop-blur">
                                    <Button type="submit" disabled={form.processing} className="min-w-40">
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Settings
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="grid gap-4 pb-6 md:grid-cols-2 xl:grid-cols-4">
                            <StatCard icon={LayoutPanelTop} label="Screens" value={String(totalScreens)} hint="Configuration groups" />
                            <StatCard icon={Blocks} label="Total Fields" value={String(totalFields)} hint="Across all screens" />
                            <StatCard icon={Eye} label="Enabled" value={String(enabledFields)} hint="Visible to employees" />
                            <StatCard icon={CheckCircle2} label="Required" value={String(requiredFields)} hint="Completion enforced" />
                        </CardContent>
                    </div>
                </Card>

                <div className="inline-flex max-w-full flex-wrap gap-1 rounded-lg border bg-muted/30 p-1">
                    {form.data.screens.map((screen, screenIndex) => {
                        const ScreenIcon = screenIcons[screenIndex % screenIcons.length];
                        const isActive = screen.key === activeScreen?.key;

                        return (
                            <button
                                key={screen.key}
                                type="button"
                                onClick={() => {
                                    setActiveScreenKey(screen.key);
                                    setSyncSourceKey('');
                                    setSyncMessage(null);
                                }}
                                className={cn(
                                    'inline-flex max-w-full items-center gap-2 rounded-md px-3.5 py-1.5 text-sm transition-colors',
                                    isActive
                                        ? 'bg-background font-medium text-foreground shadow-xs'
                                        : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
                                )}
                            >
                                <ScreenIcon className="h-4 w-4 shrink-0" />
                                <span className="truncate">{screen.label}</span>
                            </button>
                        );
                    })}
                </div>

                {activeScreen ? (
                    <ScreenPanel
                        screen={activeScreen}
                        screenIndex={activeScreenIndex}
                        syncSourceOptions={syncSourceOptions}
                        syncSourceKey={syncSourceKey}
                        syncMessage={syncMessage}
                        onSyncSourceChange={setSyncSourceKey}
                        onSync={() => handleSyncFromSource(syncSourceKey)}
                        onQuickSync={(sourceKey) => {
                            setSyncSourceKey(sourceKey);
                            handleSyncFromSource(sourceKey);
                        }}
                        updateField={updateField}
                    />
                ) : null}

                <div className="flex justify-end">
                    <Button type="submit" disabled={form.processing} size="lg" className="min-w-48 shadow-sm">
                        <Save className="mr-2 h-4 w-4" />
                        Save Field Settings
                    </Button>
                </div>
            </form>
        </PerformancePage>
    );
}

type ScreenPanelProps = {
    screen: EmployeeFieldConfigScreen;
    screenIndex: number;
    syncSourceOptions: EmployeeFieldConfigScreen[];
    syncSourceKey: string;
    syncMessage: string | null;
    onSyncSourceChange: (value: string) => void;
    onSync: () => void;
    onQuickSync: (sourceKey: string) => void;
    updateField: (
        screenIndex: number,
        fieldIndex: number,
        updater: (field: EmployeeFieldConfigItem) => EmployeeFieldConfigItem,
    ) => void;
};

function ScreenPanel({
    screen,
    screenIndex,
    syncSourceOptions,
    syncSourceKey,
    syncMessage,
    onSyncSourceChange,
    onSync,
    onQuickSync,
    updateField,
}: ScreenPanelProps) {
    const ScreenIcon = screenIcons[screenIndex % screenIcons.length];
    const enabledCount = screen.fields.filter((field) => field.enabled).length;
    const requiredCount = screen.fields.filter((field) => field.required).length;
    const completeProfileScreen = syncSourceOptions.find((option) => option.key === 'complete_profile');

    return (
        <Card className="overflow-hidden border-0 shadow-md">
            <CardHeader className="border-b bg-muted/30">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <ScreenIcon className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-xl">{screen.label}</CardTitle>
                            <CardDescription className="text-sm leading-6">
                                Manage visibility, completion rules, and display order for fields on this screen.
                            </CardDescription>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                            <Eye className="h-3.5 w-3.5" />
                            {enabledCount} enabled
                        </Badge>
                        <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {requiredCount} required
                        </Badge>
                        <Badge variant="outline" className="gap-1.5 px-3 py-1">
                            <Blocks className="h-3.5 w-3.5" />
                            {screen.fields.length} fields
                        </Badge>
                    </div>
                </div>

                <div className="mt-4 rounded-2xl border bg-background/80 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Sync from another screen</p>
                            <p className="text-xs text-muted-foreground">
                                Copy enabled, required, and display order for matching fields. Fields that only exist on this screen are left unchanged.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Select value={syncSourceKey} onValueChange={onSyncSourceChange}>
                                <SelectTrigger className="w-full sm:w-[240px]">
                                    <SelectValue placeholder="Choose source screen" />
                                </SelectTrigger>
                                <SelectContent>
                                    {syncSourceOptions.map((option) => (
                                        <SelectItem key={option.key} value={option.key}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button type="button" variant="outline" disabled={!syncSourceKey} onClick={onSync}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Sync fields
                            </Button>
                        </div>
                    </div>

                    {completeProfileScreen && screen.key !== 'complete_profile' ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="text-xs text-muted-foreground">Quick sync:</span>
                            <Button type="button" size="sm" variant="secondary" onClick={() => onQuickSync('complete_profile')}>
                                Match Complete Profile
                            </Button>
                        </div>
                    ) : null}

                    {syncMessage ? (
                        <p className="mt-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
                            {syncMessage}
                        </p>
                    ) : null}
                </div>
            </CardHeader>

            <CardContent className="p-5">
                <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                    {screen.fields.map((field, fieldIndex) => (
                        <FieldCard
                            key={field.field_key}
                            field={field}
                            onUpdate={(updater) => updateField(screenIndex, fieldIndex, updater)}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

type FieldCardProps = {
    field: EmployeeFieldConfigItem;
    onUpdate: (updater: (field: EmployeeFieldConfigItem) => EmployeeFieldConfigItem) => void;
};

function FieldCard({ field, onUpdate }: FieldCardProps) {
    return (
        <div className="rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Fingerprint className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">{field.label}</h3>
                            <p className="text-xs text-muted-foreground">{field.field_key}</p>
                        </div>
                    </div>
                </div>

                {!field.configurable && (
                    <Badge variant="outline" className="gap-1.5">
                        <Lock className="h-3 w-3" />
                        Locked
                    </Badge>
                )}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <MetaPill icon={Layers3} label="Section" value={field.section} />
                <MetaPill icon={Type} label="Type" value={field.input_type} />
            </div>

            <div className="mt-4 rounded-2xl bg-muted/30 p-3">
                <div className="grid gap-3">
                    <label
                        htmlFor={`field-${field.field_key}-enabled`}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2.5"
                    >
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                Show field
                            </div>
                            <p className="text-xs text-muted-foreground">Make this field visible on the screen.</p>
                        </div>
                        <Checkbox
                            id={`field-${field.field_key}-enabled`}
                            checked={field.enabled}
                            disabled={!field.configurable}
                            onCheckedChange={(checked) =>
                                onUpdate((currentField) => ({
                                    ...currentField,
                                    enabled: checked === true,
                                    required: checked === true ? currentField.required : false,
                                }))
                            }
                        />
                    </label>

                    <label
                        htmlFor={`field-${field.field_key}-required`}
                        className={`flex items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2.5 ${
                            !field.enabled || !field.configurable ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                        }`}
                    >
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                                Require field
                            </div>
                            <p className="text-xs text-muted-foreground">Enforce completion before submission.</p>
                        </div>
                        <Checkbox
                            id={`field-${field.field_key}-required`}
                            checked={field.required}
                            disabled={!field.enabled || !field.configurable}
                            onCheckedChange={(checked) =>
                                onUpdate((currentField) => ({
                                    ...currentField,
                                    required: checked === true,
                                }))
                            }
                        />
                    </label>

                    <div className="rounded-xl border bg-background px-3 py-2.5">
                        <div className="flex items-center justify-between gap-3">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    Display order
                                </div>
                                <p className="text-xs text-muted-foreground">Lower numbers appear earlier.</p>
                            </div>
                            <Input
                                type="number"
                                min={1}
                                className="h-10 w-24"
                                value={field.display_order}
                                onChange={(event) =>
                                    onUpdate((currentField) => ({
                                        ...currentField,
                                        display_order: Number(event.target.value) || currentField.display_order,
                                    }))
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

type StatCardProps = {
    icon: typeof LayoutPanelTop;
    label: string;
    value: string;
    hint: string;
};

function StatCard({ icon: Icon, label, value, hint }: StatCardProps) {
    return (
        <div className="rounded-2xl border bg-background/80 p-4 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold tracking-tight">{value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{hint}</p>
        </div>
    );
}

type MetaPillProps = {
    icon: typeof Layers3;
    label: string;
    value: string;
};

function MetaPill({ icon: Icon, label, value }: MetaPillProps) {
    return (
        <div className="rounded-xl border bg-muted/20 px-3 py-2">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {label}
            </div>
            <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
        </div>
    );
}
