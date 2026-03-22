<?php

namespace App\Exports\Performance;

class RatingDistributionExport extends BasePerformanceExport
{
    protected function headings(): array
    {
        return ['Rating', 'Total'];
    }

    protected function mapRow(mixed $row): array
    {
        return [
            $row->rating,
            $row->total,
        ];
    }
}
