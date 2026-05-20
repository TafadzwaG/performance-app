<?php

namespace App\Exports\Performance;

class DepartmentSummaryExport extends BasePerformanceExport
{
    protected function headings(): array
    {
        return ['Department', 'Total Appraisals', 'Average Effective Score'];
    }

    protected function mapRow(mixed $row): array
    {
        return [
            $row->department,
            $row->total,
            round((float) $row->average_score, 2),
        ];
    }
}
