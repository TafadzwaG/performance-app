import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeCheck, CircleAlert, CircleDashed, CircleGauge } from 'lucide-react';

interface ScoreSummaryCardProps {
    businessScore?: number | null;
    valuesScore?: number | null;
    overallScore?: number | null;
    overallRating?: string | null;
    layout?: 'grid' | 'row';
}

export default function ScoreSummaryCard({
    businessScore,
    valuesScore,
    overallScore,
    overallRating,
    layout = 'row',
}: ScoreSummaryCardProps) {
    const ratingLabel = overallRating ?? 'Pending';
    const commentary = buildRatingComment(overallScore, ratingLabel);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Score Summary</CardTitle>
            </CardHeader>

            <CardContent className={layout === 'row' ? 'space-y-3' : 'grid gap-4 lg:grid-cols-4'}>
                {layout === 'row' ? (
                    <>
                        <ScoreDonutRow label="Business" value={businessScore} />
                        <ScoreDonutRow label="Values" value={valuesScore} />
                        <ScoreDonutRow label="Overall" value={overallScore} emphasize />
                        <FinalRatingRow ratingLabel={ratingLabel} commentary={commentary} score={overallScore} />
                    </>
                ) : (
                    <>
                        <ScoreDonut label="Business" value={businessScore} />
                        <ScoreDonut label="Values" value={valuesScore} />
                        <ScoreDonut label="Overall" value={overallScore} emphasize />
                        <FinalRatingCard ratingLabel={ratingLabel} commentary={commentary} score={overallScore} />
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function ScoreDonutRow({
    label,
    value,
    emphasize = false,
}: {
    label: string;
    value?: number | null;
    emphasize?: boolean;
}) {
    const safe = clampScore(value);
    const tone = getPerformanceTone(value);
    const radius = emphasize ? 24 : 21;
    const size = emphasize ? 66 : 58;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (safe / 100) * circumference;

    return (
        <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-4">
            <div className="flex items-center gap-4">
                <div className="relative" style={{ width: size, height: size }}>
                    <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            className="stroke-muted"
                            strokeWidth={emphasize ? 8 : 7}
                            fill="none"
                        />
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            className={tone.strokeClass}
                            strokeWidth={emphasize ? 8 : 7}
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-foreground">
                        {formatPercent(value)}
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="text-sm font-medium text-foreground">{label}</div>
                    <div
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone.badgeClass}`}
                    >
                        {value == null ? (
                            <CircleDashed className="h-3.5 w-3.5" />
                        ) : (
                            <CircleGauge className="h-3.5 w-3.5" />
                        )}
                        {tone.label}
                    </div>
                </div>
            </div>

            <div className="text-right">
                <div className="text-xs text-muted-foreground">Score</div>
                <div className="text-lg font-semibold text-foreground">{formatPercent(value)}</div>
            </div>
        </div>
    );
}

function FinalRatingRow({
    ratingLabel,
    commentary,
    score,
}: {
    ratingLabel: string;
    commentary: string;
    score?: number | null;
}) {
    const tone = getPerformanceTone(score);

    return (
        <div className="rounded-lg border bg-muted/20 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                        Final Rating
                    </div>

                    <div
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${tone.badgeClass}`}
                    >
                        <CircleGauge className="h-3.5 w-3.5" />
                        {ratingLabel}
                    </div>
                </div>

                <div className="w-full rounded-md border bg-background/70 p-3 md:max-w-xl">
                    <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <CircleAlert className="h-3.5 w-3.5" />
                        Performance Comment
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">{commentary}</p>
                </div>
            </div>
        </div>
    );
}

function FinalRatingCard({
    ratingLabel,
    commentary,
    score,
}: {
    ratingLabel: string;
    commentary: string;
    score?: number | null;
}) {
    const tone = getPerformanceTone(score);

    return (
        <div className="rounded-lg border bg-muted/20 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                Final Rating
            </div>
            <div
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${tone.badgeClass}`}
            >
                <CircleGauge className="h-3.5 w-3.5" />
                {ratingLabel}
            </div>
            <div className="mt-3 rounded-md border bg-background/70 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <CircleAlert className="h-3.5 w-3.5" />
                    Performance Comment
                </div>
                <p className="text-sm leading-relaxed text-foreground">{commentary}</p>
            </div>
        </div>
    );
}

function ScoreDonut({
    label,
    value,
    emphasize = false,
}: {
    label: string;
    value?: number | null;
    emphasize?: boolean;
}) {
    const safe = clampScore(value);
    const tone = getPerformanceTone(value);
    const radius = emphasize ? 24 : 21;
    const size = emphasize ? 66 : 58;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (safe / 100) * circumference;

    return (
        <div className="rounded-lg border bg-muted/20 p-4">
            <div className="mb-3 text-sm text-muted-foreground">{label}</div>
            <div className="flex items-center gap-3">
                <div className="relative" style={{ width: size, height: size }}>
                    <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            className="stroke-muted"
                            strokeWidth={emphasize ? 8 : 7}
                            fill="none"
                        />
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            className={tone.strokeClass}
                            strokeWidth={emphasize ? 8 : 7}
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-foreground">
                        {formatPercent(value)}
                    </div>
                </div>
                <div className="space-y-1">
                    <div
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone.badgeClass}`}
                    >
                        {value == null ? (
                            <CircleDashed className="h-3.5 w-3.5" />
                        ) : (
                            <CircleGauge className="h-3.5 w-3.5" />
                        )}
                        {tone.label}
                    </div>
                </div>
            </div>
        </div>
    );
}

function clampScore(value?: number | null): number {
    if (value == null || Number.isNaN(value)) {
        return 0;
    }

    return Math.max(0, Math.min(100, Number(value)));
}

function formatPercent(value?: number | null): string {
    if (value == null || Number.isNaN(value)) {
        return '--';
    }

    return `${Math.round(clampScore(value))}%`;
}

function getPerformanceTone(value?: number | null): { label: string; strokeClass: string; badgeClass: string } {
    if (value == null || Number.isNaN(value)) {
        return {
            label: 'Pending',
            strokeClass: 'stroke-muted-foreground/50',
            badgeClass: 'border-muted-foreground/30 bg-muted text-muted-foreground',
        };
    }

    if (value >= 80) {
        return {
            label: 'High',
            strokeClass: 'stroke-emerald-600',
            badgeClass: 'border-emerald-300 bg-emerald-50 text-emerald-700',
        };
    }

    if (value >= 60) {
        return {
            label: 'Moderate',
            strokeClass: 'stroke-amber-500',
            badgeClass: 'border-amber-300 bg-amber-50 text-amber-700',
        };
    }

    return {
        label: 'Needs Attention',
        strokeClass: 'stroke-rose-600',
        badgeClass: 'border-rose-300 bg-rose-50 text-rose-700',
    };
}

function buildRatingComment(score: number | null | undefined, rating: string): string {
    if (score == null || Number.isNaN(score)) {
        return 'Final score is not available yet. Complete required ratings and approvals to produce a final performance outcome.';
    }

    if (score >= 80) {
        return `Overall rating is ${rating}. Performance is consistently strong against agreed targets, with clear evidence of impact and reliable delivery.`;
    }

    if (score >= 60) {
        return `Overall rating is ${rating}. Performance is on track in key areas, with selected objectives requiring focused improvement and follow-through.`;
    }

    return `Overall rating is ${rating}. Performance is below expected standard and requires a structured improvement plan with close manager follow-up.`;
}