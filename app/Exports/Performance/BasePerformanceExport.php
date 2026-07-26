<?php

namespace App\Exports\Performance;

use App\Support\Branding;
use App\Support\Tenancy\TenantStoragePath;
use Illuminate\Support\Collection;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

abstract class BasePerformanceExport
{
    public function __construct(
        protected readonly Collection $rows,
    ) {}

    abstract protected function headings(): array;

    abstract protected function mapRow(mixed $row): array;

    /**
     * @return array<int, string>
     */
    public function headingLabels(): array
    {
        return $this->headings();
    }

    /**
     * @return array<int, array<int, mixed>>
     */
    public function dataRows(): array
    {
        return $this->rows
            ->map(fn (mixed $row) => $this->mapRow($row))
            ->values()
            ->all();
    }

    public function rowCount(): int
    {
        return $this->rows->count();
    }

    public function download(string $filename): BinaryFileResponse
    {
        $directory = TenantStoragePath::exportDirectory();

        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $path = $directory.DIRECTORY_SEPARATOR.$filename;

        $writer = new Writer;
        $writer->openToFile($path);

        foreach ($this->organizationHeaderRows() as $headerRow) {
            $writer->addRow(Row::fromValues($headerRow));
        }

        $writer->addRow(Row::fromValues($this->headings()));

        foreach ($this->rows as $row) {
            $writer->addRow(Row::fromValues($this->mapRow($row)));
        }

        if ($footer = $this->organizationFooter()) {
            $writer->addRow(Row::fromValues([$footer]));
        }

        $writer->close();

        return response()->download($path, $filename)->deleteFileAfterSend(true);
    }

    private function organizationHeaderRows(): array
    {
        $context = Branding::exportHeaderContext();

        return array_values(array_filter([
            [$context['companyName']],
            filled($context['companyAddress']) ? [$context['companyAddress']] : null,
            [''],
        ]));
    }

    private function organizationFooter(): ?string
    {
        return Branding::exportHeaderContext()['reportFooter'];
    }
}
