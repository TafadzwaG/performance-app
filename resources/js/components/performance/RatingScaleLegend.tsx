import { Badge } from '@/components/ui/badge';
import type { RatingScaleLevel } from '@/types/performance';

export default function RatingScaleLegend({ levels }: { levels: RatingScaleLevel[] }) {
    return (
        <div className="space-y-3">
            {levels.map((level) => (
                <div key={level.id} className="rounded-md border bg-background p-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{level.short_label ?? level.value}</Badge>
                        <span className="font-medium">{level.label}</span>
                        <span className="text-xs text-muted-foreground">
                            {level.min_percent !== null && level.max_percent !== null
                                ? `${level.min_percent}-${level.max_percent}%`
                                : `Score ${level.value}`}
                        </span>
                    </div>
                    {level.description && (
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">{level.description}</p>
                    )}
                </div>
            ))}
        </div>
    );
}
