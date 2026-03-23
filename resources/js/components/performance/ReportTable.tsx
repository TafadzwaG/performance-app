import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table2 } from 'lucide-react';

interface ReportTableProps {
    rows: Array<Record<string, unknown>>;
}

function formatHeader(header: string) {
    return header.replaceAll('_', ' ');
}

function formatValue(value: unknown) {
    if (typeof value === 'number') {
        return value.toLocaleString();
    }

    if (typeof value === 'string') {
        const numeric = Number(value.replace(/,/g, '').trim());
        if (!Number.isNaN(numeric) && value.trim() !== '') {
            return numeric.toLocaleString();
        }

        return value;
    }

    if (value === null || value === undefined) {
        return '';
    }

    return String(value);
}

function toNumber(value: unknown) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const parsed = Number(value.replace(/,/g, '').trim());
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }

    return null;
}

export default function ReportTable({ rows }: ReportTableProps) {
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

    const numericColumns = headers.filter((header) =>
        rows.every((row) => {
            const value = row[header];
            return value === null || value === undefined || value === '' || toNumber(value) !== null;
        }),
    );

    const totals = headers.reduce<Record<string, string>>((acc, header) => {
        if (!numericColumns.includes(header)) {
            acc[header] = header === headers[0] ? 'Total' : '';
            return acc;
        }

        const sum = rows.reduce((total, row) => total + (toNumber(row[header]) ?? 0), 0);
        acc[header] = sum.toLocaleString();
        return acc;
    }, {});

    const isStatusBadgeColumn = (header: string) => {
        const normalized = header.toLowerCase();
        return (
            normalized.includes('started') ||
            normalized.includes('self_assessment') ||
            normalized.includes('manager_review') ||
            normalized.includes('completed') ||
            normalized.includes('overdue')
        );
    };

    return (
        <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/20">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-lg">Completion Breakdown</CardTitle>
                        <CardDescription>
                            Department-level workflow counts for the currently selected review cycle.
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Table2 className="h-4 w-4" />
                        <span>{rows.length} row(s)</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {rows.length === 0 ? (
                    <div className="flex min-h-[260px] items-center justify-center p-6 text-sm text-muted-foreground">
                        No report rows available for the selected filters.
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-muted/30 text-left">
                                    <tr>
                                        {headers.map((header) => {
                                            const centered = numericColumns.includes(header);

                                            return (
                                                <th
                                                    key={header}
                                                    className={`px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground ${
                                                        centered ? 'text-center' : 'text-left'
                                                    }`}
                                                >
                                                    {formatHeader(header)}
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>

                                <tbody>
                                    {rows.map((row, rowIndex) => (
                                        <tr
                                            key={`row-${rowIndex}`}
                                            className="border-t transition-colors hover:bg-muted/20 odd:bg-background even:bg-muted/[0.02]"
                                        >
                                            {headers.map((header, columnIndex) => {
                                                const value = row[header];
                                                const displayValue = formatValue(value);
                                                const isNumeric = numericColumns.includes(header);
                                                const isFirstColumn = columnIndex === 0;

                                                return (
                                                    <td
                                                        key={`${rowIndex}-${header}`}
                                                        className={`px-4 py-4 ${
                                                            isNumeric ? 'text-center' : 'text-left'
                                                        }`}
                                                    >
                                                        {isStatusBadgeColumn(header) && displayValue !== '' ? (
                                                            <Badge variant="secondary" className="font-medium">
                                                                {displayValue}
                                                            </Badge>
                                                        ) : (
                                                            <span
                                                                className={
                                                                    isFirstColumn
                                                                        ? 'font-medium text-foreground'
                                                                        : 'text-muted-foreground'
                                                                }
                                                            >
                                                                {displayValue}
                                                            </span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>

                                {numericColumns.length > 0 && (
                                    <tfoot>
                                        <tr className="border-t bg-muted/30">
                                            {headers.map((header, index) => (
                                                <td
                                                    key={`total-${header}`}
                                                    className={`px-4 py-4 font-semibold ${
                                                        numericColumns.includes(header) ? 'text-center' : 'text-left'
                                                    } ${index === 0 ? 'text-foreground' : 'text-muted-foreground'}`}
                                                >
                                                    {totals[header]}
                                                </td>
                                            ))}
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>

                        <div className="flex items-center justify-between border-t bg-muted/10 px-4 py-3 text-xs text-muted-foreground">
                            <span>Showing all visible rows for the selected cycle.</span>
                            <span>{rows.length} department record(s)</span>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}