import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ScoreSummaryCardProps {
    businessScore?: number | null;
    valuesScore?: number | null;
    overallScore?: number | null;
    overallRating?: string | null;
}

export default function ScoreSummaryCard({ businessScore, valuesScore, overallScore, overallRating }: ScoreSummaryCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Score Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
                <Metric label="Business" value={businessScore} />
                <Metric label="Values" value={valuesScore} />
                <Metric label="Overall" value={overallScore} />
                <Metric label="Rating" value={overallRating ?? 'Pending'} isText />
            </CardContent>
        </Card>
    );
}

function Metric({ label, value, isText = false }: { label: string; value?: number | string | null; isText?: boolean }) {
    return (
        <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-1 text-2xl font-semibold">{value ?? (isText ? 'Pending' : '0.00')}</div>
        </div>
    );
}
