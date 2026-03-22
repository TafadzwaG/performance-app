<?php

namespace App\Exports\Performance;

class CycleSummaryExport extends BasePerformanceExport
{
    protected function headings(): array
    {
        return ['Cycle', 'Total Appraisals', 'Average Score'];
    }

    protected function mapRow(mixed $row): array
    {
        return [
            $row->cycle,
            $row->total,
            round((float) $row->average_score, 2),
        ];
    }
}
