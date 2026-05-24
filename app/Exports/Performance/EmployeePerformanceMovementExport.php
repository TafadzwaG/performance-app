<?php

namespace App\Exports\Performance;

use Illuminate\Support\Collection;

class EmployeePerformanceMovementExport extends BasePerformanceExport
{
    /**
     * @param  Collection<int, array<string, mixed>>|Collection<int, object>  $rows
     */
    public function __construct(Collection $rows)
    {
        parent::__construct($rows);
    }

    protected function headings(): array
    {
        return [
            'Employee',
            'Employee Number',
            'Department',
            'Job Title',
            'Scorecard',
            'Previous Cycle',
            'Current Cycle',
            'Previous Score',
            'Current Score',
            'Score Delta',
            'Trend Status',
            'Cohort Average',
            'Cohort Rank',
            'Gap From Cohort Average',
        ];
    }

    protected function mapRow(mixed $row): array
    {
        $data = is_array($row) ? $row : (array) $row;

        return [
            $data['employee_name'] ?? '',
            $data['employee_number'] ?? '',
            $data['department'] ?? '',
            $data['job_title'] ?? '',
            $data['template_name'] ?? '',
            $data['previous_cycle_name'] ?? '',
            $data['current_cycle_name'] ?? '',
            $data['previous_score'] ?? '',
            $data['current_score'] ?? '',
            $data['score_delta'] ?? '',
            $data['trend_label'] ?? $data['trend_status'] ?? '',
            $data['cohort_average'] ?? '',
            $data['cohort_rank'] ?? '',
            $data['gap_from_cohort_average'] ?? '',
        ];
    }
}
