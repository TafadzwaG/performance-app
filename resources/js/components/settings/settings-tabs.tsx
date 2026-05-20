import { cn } from '@/lib/utils';
import { Settings2, ServerCog } from 'lucide-react';

export type SettingsTab = 'general' | 'operations';

type Props = {
    active: SettingsTab;
    onChange: (tab: SettingsTab) => void;
};

const tabs: { id: SettingsTab; label: string; icon: typeof Settings2 }[] = [
    { id: 'general', label: 'General', icon: Settings2 },
    { id: 'operations', label: 'Operations', icon: ServerCog },
];

export default function SettingsTabs({ active, onChange }: Props) {
    return (
        <div className="inline-flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1">
            {tabs.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    type="button"
                    onClick={() => onChange(id)}
                    className={cn(
                        'inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm transition-colors',
                        active === id
                            ? 'bg-background font-medium text-foreground shadow-xs'
                            : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
                    )}
                >
                    <Icon className="h-4 w-4" />
                    {label}
                </button>
            ))}
        </div>
    );
}
