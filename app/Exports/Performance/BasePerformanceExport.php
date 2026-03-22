<?php

namespace App\Exports\Performance;

use Illuminate\Support\Collection;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

abstract class BasePerformanceExport
{
    public function __construct(
        protected readonly Collection $rows,
    ) {
    }

    abstract protected function headings(): array;

    abstract protected function mapRow(mixed $row): array;

    public function download(string $filename): BinaryFileResponse
    {
        $directory = storage_path('app/exports');

        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $path = $directory.DIRECTORY_SEPARATOR.$filename;

        $writer = new Writer();
        $writer->openToFile($path);
        $writer->addRow(Row::fromValues($this->headings()));

        foreach ($this->rows as $row) {
            $writer->addRow(Row::fromValues($this->mapRow($row)));
        }

        $writer->close();

        return response()->download($path, $filename)->deleteFileAfterSend(true);
    }
}
