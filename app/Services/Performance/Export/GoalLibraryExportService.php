<?php

namespace App\Services\Performance\Export;

use App\Models\GoalLibraryItem;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Border;
use OpenSpout\Common\Entity\Style\BorderPart;
use OpenSpout\Common\Entity\Style\Color;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\XLSX\Options;
use OpenSpout\Writer\XLSX\Options\PageOrientation;
use OpenSpout\Writer\XLSX\Options\PageSetup;
use OpenSpout\Writer\XLSX\Options\PaperSize;
use OpenSpout\Writer\XLSX\Writer;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class GoalLibraryExportService
{
    public function excel(Collection $rows, User $actor, array $filters = []): BinaryFileResponse
    {
        $context = $this->buildContext($rows, $actor, $filters);

        $fileName = 'goal-library-'.Carbon::now()->format('Ymd-Hi').'.xlsx';
        $filePath = storage_path('app/exports/'.$fileName);
        $this->ensureDirectory(dirname($filePath));

        $options = new Options;
        $options->setColumnWidth(18, 1);
        $options->setColumnWidth(34, 2);
        $options->setColumnWidth(24, 3);
        $options->setColumnWidth(28, 4);
        $options->setColumnWidth(10, 5);
        $options->setColumnWidth(22, 6);
        $options->setColumnWidth(20, 7);
        $options->setColumnWidth(20, 8);
        $options->setColumnWidth(10, 9);
        $options->DEFAULT_ROW_HEIGHT = 18;
        $options->setPageSetup(new PageSetup(PageOrientation::LANDSCAPE, PaperSize::A4));

        $writer = new Writer($options);
        $writer->openToFile($filePath);
        $writer->getCurrentSheet()->setName('Goal Library');

        $this->writeHeader($writer, $context);
        $this->writeFilterSummary($writer, $context);
        $this->writeGoalCatalog($writer, $context);
        $this->writeFooter($writer, $context);

        $writer->close();

        return response()->download($filePath, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    private function buildContext(Collection $rows, User $actor, array $filters): array
    {
        $settings = SystemSetting::query()->first();

        return [
            'rows' => $rows,
            'filters' => $filters,
            'settings' => $settings,
            'companyName' => $settings?->company_name ?? 'Performance Appraisal Studio',
            'companyAddress' => $settings?->formattedAddress(),
            'reportFooter' => $settings?->report_footer,
            'exportedBy' => $actor->name,
            'exportedByEmail' => $actor->email,
            'exportedAt' => Carbon::now(),
            'totalRows' => $rows->count(),
        ];
    }

    private function ensureDirectory(string $directory): void
    {
        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }
    }

    private function writeHeader(Writer $writer, array $context): void
    {
        $titleStyle = (new Style)->setFontSize(18)->setFontBold()->setFontColor('252627');
        $subtitleStyle = (new Style)->setFontSize(11)->setFontColor('5F5A4A');
        $eyebrowStyle = (new Style)->setFontSize(9)->setFontBold()->setFontColor('8A8268');

        $writer->addRow(Row::fromValues([$context['companyName']], $titleStyle));

        if ($context['companyAddress']) {
            $writer->addRow(Row::fromValues([$context['companyAddress']], $subtitleStyle));
        }

        $writer->addRow(Row::fromValues(['§ GOAL LIBRARY'], $eyebrowStyle));
        $writer->addRow(Row::fromValues([
            sprintf(
                'Reusable SMART goals catalogue   |   %d goal%s exported',
                $context['totalRows'],
                $context['totalRows'] === 1 ? '' : 's',
            ),
        ], $subtitleStyle));
        $writer->addRow(Row::fromValues([
            sprintf(
                'Exported by %s (%s) at %s',
                $context['exportedBy'],
                $context['exportedByEmail'],
                $context['exportedAt']->format('d M Y H:i'),
            ),
        ], $subtitleStyle));
        $writer->addRow(Row::fromValues(['']));
    }

    private function writeFilterSummary(Writer $writer, array $context): void
    {
        $filters = $context['filters'];
        $hasFilters = collect($filters)->filter(fn ($value) => filled($value))->isNotEmpty();

        $this->writeSectionHeading($writer, '§ Export Filters');

        $labelStyle = (new Style)->setFontBold()->setFontColor('252627');
        $summaryRows = [
            ['Search', $filters['search'] ?? 'All goals'],
            ['Department', $filters['department'] ?? 'All departments'],
            ['Position', $filters['job_title'] ?? 'All positions'],
            ['Perspective', $filters['perspective'] ?? 'All perspectives'],
        ];

        foreach ($summaryRows as [$label, $value]) {
            $writer->addRow(Row::fromValues([$label, $this->scalar($value)], $labelStyle));
        }

        if (! $hasFilters) {
            $writer->addRow(Row::fromValues([
                'Note',
                'No filters were applied. This export includes the full active goal library.',
            ], $labelStyle));
        }

        $writer->addRow(Row::fromValues(['']));
    }

    private function writeGoalCatalog(Writer $writer, array $context): void
    {
        $this->writeSectionHeading($writer, '§ Goal Catalog');

        $this->writeTableHeader($writer, [
            'Perspective',
            'Objective',
            'KPI / Measure',
            'Target Definition',
            'Weight (%)',
            'Evidence Source',
            'Department',
            'Position',
            'Active',
        ]);

        if ($context['rows']->isEmpty()) {
            $this->writeTableRow($writer, [
                '—',
                'No goals matched the selected filters.',
                '—',
                '—',
                '—',
                '—',
                '—',
                '—',
                '—',
            ]);

            return;
        }

        foreach ($context['rows'] as $item) {
            /** @var GoalLibraryItem $item */
            $this->writeTableRow($writer, [
                $item->perspective?->name ?? '—',
                $item->title,
                $item->kpi_measure ?? '—',
                $item->target_definition ?? '—',
                $item->default_weight !== null ? number_format((float) $item->default_weight, 2) : '—',
                $item->evidence_source ?? '—',
                $item->department?->name ?? 'All departments',
                $item->jobTitle?->name ?? 'All positions',
                $item->is_active ? 'Yes' : 'No',
            ]);
        }
    }

    private function writeFooter(Writer $writer, array $context): void
    {
        $writer->addRow(Row::fromValues(['']));

        $footerStyle = (new Style)
            ->setFontSize(9)
            ->setFontItalic()
            ->setFontColor('8A8268');

        if ($context['reportFooter']) {
            $writer->addRow(Row::fromValues([$context['reportFooter']], $footerStyle));
        }

        $writer->addRow(Row::fromValues([
            sprintf(
                'Generated by %s on %s.',
                $context['exportedBy'],
                $context['exportedAt']->format('d M Y H:i'),
            ),
        ], $footerStyle));
    }

    private function writeSectionHeading(Writer $writer, string $label): void
    {
        $style = (new Style)
            ->setFontBold()
            ->setFontSize(12)
            ->setFontColor('252627')
            ->setBackgroundColor('F3EEDD');

        $writer->addRow(Row::fromValues([$label], $style));
    }

    private function writeTableHeader(Writer $writer, array $headings): void
    {
        $style = (new Style)
            ->setFontBold()
            ->setFontColor('FFFFFF')
            ->setBackgroundColor('252627')
            ->setBorder(new Border(
                new BorderPart(Border::TOP, Color::BLACK, Border::WIDTH_THIN, Border::STYLE_SOLID),
                new BorderPart(Border::BOTTOM, Color::BLACK, Border::WIDTH_THIN, Border::STYLE_SOLID),
            ));

        $writer->addRow(Row::fromValues($headings, $style));
    }

    private function writeTableRow(Writer $writer, array $values): void
    {
        $style = (new Style)
            ->setShouldWrapText()
            ->setBorder(new Border(
                new BorderPart(Border::TOP, 'BFB48F', Border::WIDTH_THIN, Border::STYLE_SOLID),
                new BorderPart(Border::BOTTOM, 'BFB48F', Border::WIDTH_THIN, Border::STYLE_SOLID),
            ));

        $writer->addRow(Row::fromValues(array_map(fn ($value) => $this->scalar($value), $values), $style));
    }

    private function scalar(mixed $value): string
    {
        if ($value === null) {
            return '—';
        }

        if ($value instanceof \BackedEnum) {
            return (string) $value->value;
        }

        if ($value instanceof \UnitEnum) {
            return $value->name;
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format('d M Y H:i');
        }

        return (string) $value;
    }
}
