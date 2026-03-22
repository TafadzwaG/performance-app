<?php

namespace App\Exports\Performance;

class CompletionStatusExport extends BasePerformanceExport
{
    protected function headings(): array
    {
        return ['Status', 'Total'];
    }

    protected function mapRow(mixed $row): array
    {
        return [
            $row->status?->value ?? $row->status,
            $row->total,
        ];
    }
}
