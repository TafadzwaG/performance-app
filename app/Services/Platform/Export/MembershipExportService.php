<?php

namespace App\Services\Platform\Export;

use App\Models\OrganizationMembership;
use App\Models\User;
use App\Support\Branding;
use App\Support\Pdf\StudioExportPdf;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
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

class MembershipExportService
{
    private const REPORT_TITLE = 'Platform Organization Memberships';

    /**
     * @param  array{search?: string|null, status?: string|null, organization_id?: int|null, organization_name?: string|null}  $filters
     */
    public function excel(Collection $rows, User $actor, array $filters = []): BinaryFileResponse
    {
        $context = $this->buildContext($rows, $actor, $filters);

        $fileName = $this->fileName('xlsx');
        $filePath = $this->exportPath($fileName);
        $this->ensureDirectory(dirname($filePath));

        $options = new Options;
        $options->setColumnWidth(24, 1);
        $options->setColumnWidth(30, 2);
        $options->setColumnWidth(28, 3);
        $options->setColumnWidth(24, 4);
        $options->setColumnWidth(18, 5);
        $options->setColumnWidth(18, 6);
        $options->setColumnWidth(16, 7);
        $options->setColumnWidth(16, 8);
        $options->setColumnWidth(22, 9);
        $options->DEFAULT_ROW_HEIGHT = 18;
        $options->setPageSetup(new PageSetup(PageOrientation::LANDSCAPE, PaperSize::A4));

        $writer = new Writer($options);
        $writer->openToFile($filePath);
        $writer->getCurrentSheet()->setName('Memberships');

        $this->writeHeader($writer, $context);
        $this->writeFilterSummary($writer, $context);
        $this->writeSummaryCounters($writer, $context);
        $this->writeMembershipDirectory($writer, $context);
        $this->writeFooter($writer, $context);

        $writer->close();

        return response()->download($filePath, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    /**
     * @param  array{search?: string|null, status?: string|null, organization_id?: int|null, organization_name?: string|null}  $filters
     */
    public function pdf(Collection $rows, User $actor, array $filters = []): BinaryFileResponse
    {
        $context = $this->buildContext($rows, $actor, $filters);

        $fileName = $this->fileName('pdf');
        $filePath = $this->exportPath($fileName);
        $this->ensureDirectory(dirname($filePath));

        StudioExportPdf::configure(
            Pdf::loadView('pdf.platform.organization-memberships', $context)
        )->save($filePath);

        return response()->download($filePath, $fileName, [
            'Content-Type' => 'application/pdf',
        ])->deleteFileAfterSend(true);
    }

    /**
     * @param  array{search?: string|null, status?: string|null, organization_id?: int|null, organization_name?: string|null}  $filters
     * @return array<string, mixed>
     */
    private function buildContext(Collection $rows, User $actor, array $filters): array
    {
        $branding = Branding::exportHeaderContext();
        $headings = $this->headings();

        return [
            ...$branding,
            'rows' => $rows,
            'filters' => $filters,
            'headings' => $headings,
            'tableRows' => $this->tableRows($rows, $headings),
            'companyName' => $branding['companyName'],
            'companyAddress' => $branding['companyAddress'],
            'reportFooter' => $branding['reportFooter'],
            'reportTitle' => self::REPORT_TITLE,
            'headerReportLabel' => self::REPORT_TITLE,
            'exportedBy' => $actor->name,
            'exportedByEmail' => $actor->email,
            'exportedAt' => Carbon::now(),
            'totalRows' => $rows->count(),
            'summary' => [
                'total' => $rows->count(),
                'active' => $rows->where('status', 'active')->count(),
                'default' => $rows->where('is_default', true)->count(),
                'allLocations' => $rows->where('access_all_locations', true)->count(),
            ],
        ];
    }

    /**
     * @return list<string>
     */
    private function headings(): array
    {
        return [
            'User',
            'Email',
            'Organization',
            'Organization slug',
            'Organization status',
            'Membership status',
            'Default organization',
            'All locations',
            'Activated at',
        ];
    }

    /**
     * @param  list<string>  $headings
     * @return array<int, array<int, string>>
     */
    private function tableRows(Collection $rows, array $headings): array
    {
        if ($rows->isEmpty()) {
            $emptyRow = array_fill(0, count($headings), '—');
            $emptyRow[0] = 'No memberships matched the selected filters.';

            return [$emptyRow];
        }

        return $rows
            ->map(fn (OrganizationMembership $membership) => $this->mapRow($membership))
            ->all();
    }

    /**
     * @return list<string>
     */
    private function mapRow(OrganizationMembership $membership): array
    {
        return [
            $this->scalar($membership->user?->name),
            $this->scalar($membership->user?->email),
            $this->scalar($membership->organization?->name),
            $this->scalar($membership->organization?->slug),
            $this->scalar($membership->organization?->status),
            $this->scalar($membership->status),
            $membership->is_default ? 'Yes' : 'No',
            $membership->access_all_locations ? 'Yes' : 'No',
            $membership->activated_at?->format('d M Y H:i') ?? '—',
        ];
    }

    private function fileName(string $extension): string
    {
        return 'platform-memberships-'.Carbon::now()->format('Ymd-Hi').'.'.$extension;
    }

    private function exportPath(string $fileName): string
    {
        return storage_path('app/exports/platform'.DIRECTORY_SEPARATOR.$fileName);
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

        $writer->addRow(Row::fromValues(['§ '.strtoupper(self::REPORT_TITLE)], $eyebrowStyle));
        $writer->addRow(Row::fromValues([
            sprintf(
                'Cross-tenant membership directory   |   %d membership%s exported',
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
        $status = $filters['status'] ?? 'all';

        $this->writeSectionHeading($writer, '§ Export Filters');

        $labelStyle = (new Style)->setFontBold()->setFontColor('252627');

        foreach ($this->filterRows($filters) as [$label, $value]) {
            $writer->addRow(Row::fromValues([$label, $this->scalar($value)], $labelStyle));
        }

        if ($status === 'all' && blank($filters['search'] ?? null) && blank($filters['organization_id'] ?? null)) {
            $writer->addRow(Row::fromValues([
                'Note',
                'No additional filters were applied. This export includes all platform memberships.',
            ], $labelStyle));
        }

        $writer->addRow(Row::fromValues(['']));
    }

    private function writeSummaryCounters(Writer $writer, array $context): void
    {
        $this->writeSectionHeading($writer, '§ Summary');

        $labelStyle = (new Style)->setFontBold()->setFontColor('252627');
        $summary = $context['summary'];

        foreach ([
            ['Total Memberships', $summary['total']],
            ['Active Memberships', $summary['active']],
            ['Default Memberships', $summary['default']],
            ['All Locations Access', $summary['allLocations']],
        ] as [$label, $value]) {
            $writer->addRow(Row::fromValues([$label, $this->scalar($value)], $labelStyle));
        }

        $writer->addRow(Row::fromValues(['']));
    }

    private function writeMembershipDirectory(Writer $writer, array $context): void
    {
        $this->writeSectionHeading($writer, '§ '.self::REPORT_TITLE);
        $this->writeTableHeader($writer, $context['headings']);

        foreach ($context['tableRows'] as $values) {
            $this->writeTableRow($writer, $values);
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

        $writer->addRow(Row::fromValues($values, $style));
    }

    /**
     * @param  array{search?: string|null, status?: string|null, organization_id?: int|null, organization_name?: string|null}  $filters
     * @return list<array{0: string, 1: string}>
     */
    private function filterRows(array $filters): array
    {
        $status = $filters['status'] ?? 'all';

        return [
            ['Search', filled($filters['search'] ?? null) ? $filters['search'] : 'All users and organizations'],
            ['Membership Status', $status === 'all' ? 'All statuses' : Str::title($status)],
            ['Organization', filled($filters['organization_name'] ?? null) ? $filters['organization_name'] : 'All organizations'],
        ];
    }

    private function scalar(mixed $value): string
    {
        if ($value === null || $value === '') {
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
