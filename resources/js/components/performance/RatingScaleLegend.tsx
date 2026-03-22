import { Badge } from '@/components/ui/badge';
import type { RatingScaleLevel } from '@/types/performance';

export default function RatingScaleLegend({ levels }: { levels: RatingScaleLevel[] }) {
    return (
        <div className="flex flex-wrap gap-2">
            {levels.map((level) => (
                <Badge key={level.id} variant="outline" className="gap-2">
                    <span className="font-medium">{level.label}</span>
                    <span className="text-muted-foreground">
                        {level.value}
                        {level.min_percent !== null && level.max_percent !== null ? ` (${level.min_percent}-${level.max_percent}%)` : ''}
                    </span>
                </Badge>
            ))}
        </div>
    );
}
