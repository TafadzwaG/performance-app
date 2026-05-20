<?php

namespace App\Exports\Performance;

use App\Support\Performance\EmployeeExportColumnRegistry;
use Illuminate\Support\Collection;

class EmployeeProfilesExport extends BasePerformanceExport
{
    public function __construct(Collection $rows, private readonly array $columns)
    {
        parent::__construct($rows);
    }

    protected function headings(): array
    {
        return EmployeeExportColumnRegistry::labelsFor($this->columns);
    }

    protected function mapRow(mixed $row): array
    {
        return collect($this->columns)
            ->map(fn (string $column) => EmployeeExportColumnRegistry::value($row, $column) ?? '')
            ->all();
    }
}
