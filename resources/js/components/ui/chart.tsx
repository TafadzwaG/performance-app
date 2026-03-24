'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import * as RechartsPrimitive from 'recharts';
import type { LegendPayload } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { TooltipContentProps as RechartsTooltipContentProps } from 'recharts/types/component/Tooltip';

const THEMES = { light: '', dark: '.dark' } as const;

export type ChartConfig = {
    [key: string]: {
        label?: React.ReactNode;
        icon?: React.ComponentType;
        color?: string;
        theme?: Record<keyof typeof THEMES, string>;
    };
};

type ChartContextProps = {
    config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
    const context = React.useContext(ChartContext);

    if (!context) {
        throw new Error('useChart must be used within a <ChartContainer />');
    }

    return context;
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
    const entries = Object.entries(config).filter(([, value]) => value.color || value.theme);

    if (!entries.length) {
        return null;
    }

    const styles = Object.entries(THEMES)
        .map(([theme, prefix]) => {
            const declarations = entries
                .map(([key, item]) => {
                    const color = item.theme?.[theme as keyof typeof THEMES] ?? item.color;

                    return color ? `  --color-${key}: ${color};` : null;
                })
                .filter(Boolean)
                .join('\n');

            return `${prefix} [data-chart='${id}'] {\n${declarations}\n}`;
        })
        .join('\n');

    return <style dangerouslySetInnerHTML={{ __html: styles }} />;
}

const ChartContainer = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<'div'> & {
        config: ChartConfig;
        children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children'];
    }
>(({ id, className, children, config, ...props }, ref) => {
    const uniqueId = React.useId().replace(/:/g, '');
    const chartId = `chart-${id ?? uniqueId}`;

    return (
        <ChartContext.Provider value={{ config }}>
            <div
                data-chart={chartId}
                ref={ref}
                className={cn(
                    'flex aspect-video justify-center text-xs',
                    '[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground',
                    '[&_.recharts-cartesian-grid_line[stroke="#ccc"]]:stroke-border/60',
                    '[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border',
                    '[&_.recharts-polar-grid_[stroke="#ccc"]]:stroke-border',
                    '[&_.recharts-reference-line_[stroke="#ccc"]]:stroke-border',
                    '[&_.recharts-sector]:outline-hidden',
                    '[&_.recharts-text]:fill-foreground',
                    '[&_.recharts-tooltip-wrapper]:outline-hidden',
                    className,
                )}
                {...props}
            >
                <ChartStyle id={chartId} config={config} />
                <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
            </div>
        </ChartContext.Provider>
    );
});

ChartContainer.displayName = 'ChartContainer';

const ChartTooltip = RechartsPrimitive.Tooltip;

type ChartTooltipContentProps = RechartsTooltipContentProps<ValueType, NameType> & {
    className?: string;
    hideLabel?: boolean;
    hideIndicator?: boolean;
    labelKey?: string;
    nameKey?: string;
    indicator?: 'line' | 'dot';
};

function getConfigEntry(config: ChartConfig, item: Record<string, unknown>, key: string) {
    const configLabelKey =
        typeof item[key] === 'string'
            ? (item[key] as string)
            : typeof item.name === 'string'
              ? item.name
              : undefined;

    return configLabelKey ? config[configLabelKey] : undefined;
}

const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
    (
        {
            active,
            payload,
            label,
            className,
            formatter,
            labelFormatter,
            hideLabel = false,
            hideIndicator = false,
            labelKey,
            nameKey,
            indicator = 'dot',
        },
        ref,
    ) => {
        const { config } = useChart();

        if (!active || !payload?.length) {
            return null;
        }

        const resolvedLabel = hideLabel
            ? null
            : labelFormatter
              ? labelFormatter(label, payload)
              : (label ?? payload[0]?.payload?.[labelKey ?? 'label']);

        return (
            <div
                ref={ref}
                className={cn('grid min-w-[12rem] gap-2 rounded-lg border bg-background/95 p-3 shadow-xl', className)}
            >
                {resolvedLabel ? (
                    <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        {resolvedLabel}
                    </div>
                ) : null}

                <div className="grid gap-2">
                    {payload.map((item: NonNullable<ChartTooltipContentProps['payload']>[number], index: number) => {
                        const dataKey = String(nameKey ? item.payload?.[nameKey] : item.dataKey ?? item.name ?? index);
                        const itemConfig = getConfigEntry(config, item.payload ?? {}, nameKey ?? 'name') ?? config[dataKey];
                        const displayLabel = itemConfig?.label ?? item.name ?? dataKey;
                        const displayValue = formatter
                            ? formatter(item.value as ValueType, item.name as NameType, item, index, item.payload)
                            : item.value;

                        return (
                            <div key={`${dataKey}-${index}`} className="flex items-center gap-2 text-sm">
                                {hideIndicator ? null : (
                                    <span
                                        className={cn(
                                            'inline-block shrink-0 rounded-sm',
                                            indicator === 'dot' ? 'h-2.5 w-2.5' : 'h-0.5 w-3',
                                        )}
                                        style={{ backgroundColor: item.color ?? item.fill ?? 'var(--foreground)' }}
                                    />
                                )}

                                <span className="text-muted-foreground">{displayLabel}</span>
                                <span className="ml-auto font-medium text-foreground">{displayValue as React.ReactNode}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    },
);

ChartTooltipContent.displayName = 'ChartTooltipContent';

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
    payload,
    className,
}: {
    payload?: ReadonlyArray<LegendPayload>;
    className?: string;
}) {
    const { config } = useChart();

    if (!payload?.length) {
        return null;
    }

    return (
        <div className={cn('flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground', className)}>
            {payload.map((item: LegendPayload) => {
                const key = String(item.dataKey ?? item.value ?? '');
                const itemConfig = config[key];

                return (
                    <div key={key} className="flex items-center gap-2">
                        <span
                            className="inline-block h-2.5 w-2.5 rounded-sm"
                            style={{ backgroundColor: item.color ?? 'var(--foreground)' }}
                        />
                        <span>{itemConfig?.label ?? item.value}</span>
                    </div>
                );
            })}
        </div>
    );
}

export {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartStyle,
    ChartTooltip,
    ChartTooltipContent,
};
