import { cn } from '@/lib/utils';
import { DatabaseBackup, ServerCog, Settings2 } from 'lucide-react';

export type SettingsTab = 'general' | 'operations' | 'disaster-recovery';

type Props = {
    active: SettingsTab;
    availableTabs: SettingsTab[];
    onChange: (tab: SettingsTab) => void;
};

const tabConfig: Record<SettingsTab, { label: string; icon: typeof Settings2 }> = {
    general: { label: 'General', icon: Settings2 },
    operations: { label: 'Operations', icon: ServerCog },
    'disaster-recovery': { label: 'Disaster Recovery', icon: DatabaseBackup },
};

export default function SettingsTabs({ active, availableTabs, onChange }: Props) {
    return (
        <div className="inline-flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1">
            {availableTabs.map((id) => {
                const { label, icon: Icon } = tabConfig[id];

                return (
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
                );
            })}
        </div>
    );
}
