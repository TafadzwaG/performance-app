<?php

namespace App\Exports\Performance;

class EmployeeSummaryExport extends BasePerformanceExport
{
    protected function headings(): array
    {
        return ['Employee', 'Employee Number', 'Cycle', 'Status', 'Business Score', 'Values Score', 'Effective Overall Score'];
    }

    protected function mapRow(mixed $row): array
    {
        return [
            $row->employee_name_snapshot,
            $row->employee_number_snapshot,
            $row->cycle_name_snapshot,
            $row->status?->value ?? $row->status,
            $row->business_score,
            $row->values_score,
            $row->effective_overall_score,
        ];
    }
}
