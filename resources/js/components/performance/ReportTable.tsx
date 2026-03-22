import { Card, CardContent } from '@/components/ui/card';

interface ReportTableProps {
    rows: Array<Record<string, unknown>>;
}

export default function ReportTable({ rows }: ReportTableProps) {
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

    return (
        <Card>
            <CardContent className="p-0">
                <div className="overflow-x-auto rounded-lg border">
                    <table className="min-w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                {headers.map((header) => (
                                    <th key={header} className="p-3 capitalize">
                                        {header.replaceAll('_', ' ')}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, rowIndex) => (
                                <tr key={`row-${rowIndex}`} className="border-t">
                                    {headers.map((header) => (
                                        <td key={`${rowIndex}-${header}`} className="p-3">
                                            {String(row[header] ?? '')}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
