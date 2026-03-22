<?php

namespace App\Exports\Performance;

class OverdueReviewsExport extends BasePerformanceExport
{
    protected function headings(): array
    {
        return ['Employee', 'Employee Number', 'Cycle', 'Status', 'Line Manager', 'Approving Manager'];
    }

    protected function mapRow(mixed $row): array
    {
        return [
            $row->employee_name_snapshot,
            $row->employee_number_snapshot,
            $row->cycle_name_snapshot,
            $row->status?->value ?? $row->status,
            $row->lineManager?->name,
            $row->approvingManager?->name,
        ];
    }
}
